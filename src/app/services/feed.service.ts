import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { PostFacadeService, PostUI } from '../api/facades';
import { CommentFacadeService, CommentUI } from '../api/facades';
import { CommunityFacadeService } from '../api/facades';
import { UserContextService } from '../user-context.service';

const FEED_PAGE_SIZE = 10;
const COMMENT_PAGE_SIZE = 5;

interface CommentState {
  items: CommentUI[];
  page: number;
  hasMore: boolean;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly postFacade = inject(PostFacadeService);
  private readonly commentFacade = inject(CommentFacadeService);
  private readonly communityFacade = inject(CommunityFacadeService);
  readonly userContext = inject(UserContextService);

  readonly posts = signal<PostUI[]>([]);
  readonly totalPosts = signal(0);
  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasMore = signal(true);
  readonly hasCommunities = signal(false);

  private currentPage = 0;
  private loading = false;
  private seenPostIds = new Set<number>();

  private readonly commentStates = signal<Map<number, CommentState>>(new Map());
  readonly replyStates = signal<Map<number, CommentUI[]>>(new Map());
  private readonly replyLoading = signal<Set<number>>(new Set());

  readonly comments = computed(() => {
    const result = new Map<number, CommentUI[]>();
    this.commentStates().forEach((state, postId) => result.set(postId, state.items));
    return result;
  });

  readonly commentsLoading = computed(() => {
    const result = new Set<number>();
    this.commentStates().forEach((state, postId) => { if (state.loading) result.add(postId); });
    return result;
  });

  readonly commentHasMore = computed(() => {
    const result = new Map<number, boolean>();
    this.commentStates().forEach((state, postId) => result.set(postId, state.hasMore));
    return result;
  });

  readonly replies = computed(() => this.replyStates());
  readonly repliesLoading = computed(() => this.replyLoading());

  async init(): Promise<void> {
    this.currentPage = 0;
    this.seenPostIds.clear();
    this.posts.set([]);
    this.hasMore.set(true);
    await Promise.all([this.loadFeed(), this.checkCommunities()]);
  }

  async loadFeed(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.isLoading.set(true);
    this.error.set(null);
    this.seenPostIds.clear();

    try {
      const result = await firstValueFrom(
        this.postFacade.getFeed({ page: 0, size: FEED_PAGE_SIZE })
      );
      this.currentPage = 0;
      this.seenPostIds = new Set(result.items.map(p => p.id));
      this.posts.set(result.items);
      this.totalPosts.set(result.totalItems);
      this.hasMore.set(result.currentPage < result.totalPages - 1);
    } catch (err: any) {
      this.error.set(err.message ?? 'Failed to load feed');
    } finally {
      this.isLoading.set(false);
      this.loading = false;
    }
  }

  async loadMorePosts(): Promise<void> {
    if (this.loading || !this.hasMore()) return;
    this.loading = true;
    this.isLoadingMore.set(true);

    try {
      const nextPage = this.currentPage + 1;
      const result = await firstValueFrom(
        this.postFacade.getFeed({ page: nextPage, size: FEED_PAGE_SIZE })
      );

      if (result.items.length === 0) {
        this.hasMore.set(false);
        return;
      }

      const newPosts = result.items.filter(p => !this.seenPostIds.has(p.id));
      newPosts.forEach(p => this.seenPostIds.add(p.id));
      this.posts.update(list => [...list, ...newPosts]);
      this.currentPage = nextPage;
      this.hasMore.set(result.currentPage < result.totalPages - 1);
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      this.isLoadingMore.set(false);
      this.loading = false;
    }
  }

  toggleLike(postId: number): void {
    const posts = this.posts();
    const idx = posts.findIndex(p => p.id === postId);
    if (idx === -1) return;

    const post = posts[idx];
    const wasLiked = post.isLiked;

    this.posts.update(list => {
      const updated = [...list];
      updated[idx] = { ...post, isLiked: !wasLiked, likeCount: wasLiked ? post.likeCount - 1 : post.likeCount + 1 };
      return updated;
    });

    firstValueFrom(this.postFacade.toggleLike(postId)).catch(() => {
      this.posts.update(list => { const r = [...list]; r[idx] = post; return r; });
    });
  }

  async checkCommunities(): Promise<void> {
    try {
      const result = await firstValueFrom(this.communityFacade.getMy({ size: 1 }));
      this.hasCommunities.set(result.totalItems > 0);
    } catch {
      this.hasCommunities.set(false);
    }
  }

  async loadComments(postId: number): Promise<void> {
    this.setCommentState(postId, { items: [], page: 0, hasMore: false, loading: true });
    try {
      const result = await firstValueFrom(
        this.commentFacade.getByPostPaged(postId, 0, COMMENT_PAGE_SIZE)
      );
      this.setCommentState(postId, {
        items: result.items,
        page: 0,
        hasMore: result.totalItems > result.items.length,
        loading: false
      });
    } catch (err) {
      console.error('Failed to load comments:', err);
      this.setCommentState(postId, { items: [], page: 0, hasMore: false, loading: false });
    }
  }

  async loadMoreComments(postId: number): Promise<void> {
    const state = this.commentStates().get(postId);
    if (!state || state.loading || !state.hasMore) return;
    this.updateCommentState(postId, { loading: true });

    try {
      const nextPage = state.page + 1;
      const result = await firstValueFrom(
        this.commentFacade.getByPostPaged(postId, nextPage, COMMENT_PAGE_SIZE)
      );
      const existingIds = new Set(state.items.map(c => c.id));
      const newItems = result.items.filter(c => !existingIds.has(c.id));
      this.updateCommentState(postId, {
        items: [...state.items, ...newItems],
        page: nextPage,
        hasMore: state.items.length + newItems.length < result.totalItems,
        loading: false
      });
    } catch (err) {
      console.error('Failed to load more comments:', err);
      this.updateCommentState(postId, { loading: false });
    }
  }

  async addComment(postId: number, content: string): Promise<void> {
    const comment = await firstValueFrom(this.commentFacade.create({ content, postId }));
    this.updateCommentState(postId, {
      items: [...(this.commentStates().get(postId)?.items ?? []), comment]
    });
    this.posts.update(list =>
      list.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)
    );
  }

  async deleteComment(postId: number, commentId: number): Promise<void> {
    await firstValueFrom(this.commentFacade.delete(commentId));

    const state = this.commentStates().get(postId);
    if (!state) return;

    const updatedItems = state.items.filter(c => c.id !== commentId);
    this.updateCommentState(postId, { items: updatedItems });
    this.posts.update(list =>
      list.map(p => p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p)
    );

    if (updatedItems.length < COMMENT_PAGE_SIZE && state.hasMore) {
      try {
        const nextPage = state.page + 1;
        const result = await firstValueFrom(
          this.commentFacade.getByPostPaged(postId, nextPage, COMMENT_PAGE_SIZE)
        );
        const existingIds = new Set(updatedItems.map(c => c.id));
        const newItems = result.items.filter(c => !existingIds.has(c.id));
        this.updateCommentState(postId, {
          items: [...updatedItems, ...newItems],
          page: nextPage,
          hasMore: updatedItems.length + newItems.length < result.totalItems
        });
      } catch (err) {
        console.error('Failed to auto-load comments after delete:', err);
      }
    }
  }

  async loadReplies(commentId: number): Promise<void> {
    this.replyLoading.update(s => new Set(s).add(commentId));
    try {
      const res = await firstValueFrom(this.commentFacade.getReplies(commentId, 0, 5));
      this.replyStates.update(m => new Map(m).set(commentId, res.items ?? []));
    } finally {
      this.replyLoading.update(s => { const n = new Set(s); n.delete(commentId); return n; });
    }
  }

  async addReply(commentId: number, content: string): Promise<void> {
    const reply = await firstValueFrom(this.commentFacade.createReply(commentId, { content }));
    this.replyStates.update(m => {
      const map = new Map(m);
      map.set(commentId, [...(map.get(commentId) ?? []), reply]);
      return map;
    });
  }

  createReply(commentId: number, content: string): Promise<void> {
    return this.addReply(commentId, content);
  }

  async deleteReply(commentId: number, replyId: number): Promise<void> {
    await firstValueFrom(this.commentFacade.delete(replyId));
    this.replyStates.update(m => {
      const newMap = new Map(m);
      newMap.set(commentId, (newMap.get(commentId) ?? []).filter(r => r.id !== replyId));
      return newMap;
    });
  }

  toggleCommentLike(postId: number, commentId: number): void {
    const state = this.commentStates().get(postId);
    if (state) {
      const idx = state.items.findIndex(c => c.id === commentId);
      if (idx !== -1) {
        const comment = state.items[idx];
        const wasLiked = comment.isLiked;
        this.updateCommentState(postId, {
          items: state.items.map((c, i) => i === idx
            ? { ...c, isLiked: !wasLiked, likeCount: wasLiked ? (c.likeCount ?? 0) - 1 : (c.likeCount ?? 0) + 1 }
            : c)
        });
        firstValueFrom(this.commentFacade.toggleLike(commentId)).catch(() => {
          this.updateCommentState(postId, { items: state.items });
        });
        return;
      }
    }

    this.replyStates.update(m => {
      const newMap = new Map(m);
      newMap.forEach((replies, cId) => {
        const idx = replies.findIndex(r => r.id === commentId);
        if (idx !== -1) {
          const wasLiked = replies[idx].isLiked;
          const updated = replies.map((r, i) => i === idx
            ? { ...r, isLiked: !wasLiked, likeCount: wasLiked ? (r.likeCount ?? 0) - 1 : (r.likeCount ?? 0) + 1 }
            : r);
          newMap.set(cId, updated);
          firstValueFrom(this.commentFacade.toggleLike(commentId)).catch(() => {
            this.replyStates.update(m2 => new Map(m2).set(cId, replies));
          });
        }
      });
      return newMap;
    });
  }

  private setCommentState(postId: number, state: CommentState): void {
    this.commentStates.update(m => new Map(m).set(postId, state));
  }

  private updateCommentState(postId: number, partial: Partial<CommentState>): void {
    this.commentStates.update(m => {
      const existing = m.get(postId) ?? { items: [], page: 0, hasMore: false, loading: false };
      return new Map(m).set(postId, { ...existing, ...partial });
    });
  }
}