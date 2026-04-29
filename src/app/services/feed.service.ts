import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { PostFacadeService, PostUI } from '../api/facades';
import { CommentFacadeService, CommentUI } from '../api/facades';
import { UserFacadeService } from '../api/facades';
import { UserContextService } from '../user-context.service';

@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly postFacade = inject(PostFacadeService);
  private readonly commentFacade = inject(CommentFacadeService);
  private readonly userFacade = inject(UserFacadeService);
  private readonly userContext = inject(UserContextService);

  readonly posts = signal<PostUI[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly comments = signal<Map<number, CommentUI[]>>(new Map());
  readonly commentsLoading = signal<Set<number>>(new Set());

  async loadFeed(page = 0): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const result = await firstValueFrom(this.postFacade.getFeed({ page, size: 20 }));
      this.posts.set(result.items);
    } catch (err: any) {
      this.error.set(err.message ?? 'Failed to load feed');
    } finally {
      this.isLoading.set(false);
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
      updated[idx] = {
        ...post,
        isLiked: !wasLiked,
        likeCount: wasLiked ? post.likeCount - 1 : post.likeCount + 1
      };
      return updated;
    });

    firstValueFrom(this.postFacade.toggleLike(postId)).catch(() => {
      this.posts.update(list => {
        const reverted = [...list];
        reverted[idx] = post;
        return reverted;
      });
    });
  }

  async loadComments(postId: number): Promise<void> {
    this.commentsLoading.update(s => new Set(s).add(postId));
    try {
      const rawComments = await firstValueFrom(this.commentFacade.getByPost(postId));

      const uniqueIds = [...new Set(rawComments.map(c => c.userId))];
      const users = await Promise.all(
        uniqueIds.map(id => firstValueFrom(this.userFacade.getById(id)).catch(() => null))
      );
      const userMap = new Map(uniqueIds.map((id, i) => [id, users[i]]));

      const enriched: CommentUI[] = rawComments.map(c => {
        const u = userMap.get(c.userId);
        const fullName = u
          ? (`${u.firstName ?? ''} ${u.lastName ?? ''}`).trim() || u.username || `User #${c.userId}`
          : `User #${c.userId}`;
        return {
          ...c,
          authorUsername: u?.username ?? `user_${c.userId}`,
          authorFullName: fullName
        };
      });

      this.comments.update(m => new Map(m).set(postId, enriched));
    } finally {
      this.commentsLoading.update(s => {
        const n = new Set(s);
        n.delete(postId);
        return n;
      });
    }
  }

  async addComment(postId: number, content: string): Promise<void> {
    const comment = await firstValueFrom(this.commentFacade.create({ content, postId }));

    const currentUser = this.userContext.user();
    const authorFullName = currentUser
      ? (`${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`).trim() || currentUser.username || 'You'
      : 'You';

    this.comments.update(m => {
      const n = new Map(m);
      n.set(postId, [
        ...(n.get(postId) ?? []),
        { ...comment, authorUsername: currentUser?.username ?? 'you', authorFullName }
      ]);
      return n;
    });

    this.posts.update(list =>
      list.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)
    );
  }
}
