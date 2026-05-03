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
  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasMore = signal(true);
  private currentPage = 0;
  private loading = false;

  private readonly commentStates = signal<Map<number, CommentState>>(new Map());
  readonly hasCommunities = signal(false);

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

  async init(): Promise<void> {
    this.currentPage = 0;
    this.posts.set([]);
    this.hasMore.set(true);
    await Promise.all([this.loadFeed(), this.checkCommunities()]);
  }

  async loadFeed(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const result = await firstValueFrom(this.postFacade.getFeed({ page: 0, size: FEED_PAGE_SIZE }));
      this.currentPage = 0;
      this.posts.set(result.items);
      this.hasMore.set(result.items.length >= FEED_PAGE_SIZE && result.currentPage < result.totalPages - 1);
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
      const result = await firstValueFrom(this.postFacade.getFeed({ page: nextPage, size: FEED_PAGE_SIZE }));
      if (result.items.length === 0) {
        this.hasMore.set(false);
        return;
      }
      const existingIds = new Set(this.posts().map(p => p.id));
      const newPosts = result.items.filter(p => !existingIds.has(p.id));
      this.posts.update(list => [...list, ...newPosts]);
      this.currentPage = nextPage;
      this.hasMore.set(result.items.length >= FEED_PAGE_SIZE && nextPage < result.totalPages - 1);
    } catch (err: any) {
      console.error('Failed to load more posts:', err);
    } finally {
      this.isLoadingMore.set(false);
      this.loading = false;
    }
  }

  async checkCommunities(): Promise<void> {
    try {
      const result = await firstValueFrom(this.communityFacade.getMy({ size: 1 }));
      this.hasCommunities.set(result.totalItems > 0);
    } catch {
      this.hasCommunities.set(false);
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
      this.posts.update(list => { const rev = [...list]; rev[idx] = post; return rev; });
    });
  }

  async loadComments(postId: number): Promise<void> {
    this.setCommentState(postId, { items: [], page: 0, hasMore: false, loading: true });
    try {
      const result = await firstValueFrom(this.commentFacade.getByPostPaged(postId, 0, COMMENT_PAGE_SIZE));
      this.setCommentState(postId, {
        items: result.items,
        page: 0,
        hasMore: result.totalItems > COMMENT_PAGE_SIZE,
        loading: false
      });
    } catch (err) {
      console.error(`Failed to load comments for post ${postId}:`, err);
      this.setCommentState(postId, { items: [], page: 0, hasMore: false, loading: false });
    }
  }

  async loadMoreComments(postId: number): Promise<void> {
    const state = this.commentStates().get(postId);
    if (!state || state.loading || !state.hasMore) return;
    this.updateCommentState(postId, { loading: true });
    try {
      const nextPage = state.page + 1;
      const result = await firstValueFrom(this.commentFacade.getByPostPaged(postId, nextPage, COMMENT_PAGE_SIZE));
      this.updateCommentState(postId, {
        items: [...state.items, ...result.items],
        page: nextPage,
        hasMore: (nextPage + 1) * COMMENT_PAGE_SIZE < result.totalItems,
        loading: false
      });
    } catch (err) {
      console.error(`Failed to load more comments for post ${postId}:`, err);
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
    if (state) {
      this.updateCommentState(postId, { items: state.items.filter(c => c.id !== commentId) });
    }
    this.posts.update(list =>
      list.map(p => p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p)
    );
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
  toggleCommentLike(postId: number, commentId: number): void {
  const state = this.commentStates().get(postId);
  if (!state) return;

  const idx = state.items.findIndex(c => c.id === commentId);
  if (idx === -1) return;

  const comment = state.items[idx];
  const wasLiked = comment.isLiked;

  // ✅ Optimistic UI update
  this.updateCommentState(postId, {
    items: state.items.map((c, i) =>
      i === idx
        ? {
            ...c,
            isLiked: !wasLiked,
            likeCount: wasLiked ? (c.likeCount ?? 0) - 1 : (c.likeCount ?? 0) + 1
          }
        : c
    )
  });

  firstValueFrom(this.commentFacade.toggleLike(commentId)).catch(() => {
    this.updateCommentState(postId, {
      items: state.items
    });
  });
}
}
