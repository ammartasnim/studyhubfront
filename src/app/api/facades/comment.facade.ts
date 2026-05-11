import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { CommentControllerService } from '../api/commentController.service';
import { CommentReqDto } from '../model/commentReqDto';
import { CommentResDto } from '../model/commentResDto';
import { PageCommentResDto } from '../model/pageCommentResDto';

import { CommentUI, PaginatedComments } from './models/comment.model';
import { formatApiError } from './models/api-error.model';

@Injectable({ providedIn: 'root' })
export class CommentFacadeService {
  private readonly commentController = inject(CommentControllerService);

  // ─── READ ─────────────────────────────────────────────────────────────────

  create(data: { content: string; postId: number }): Observable<CommentUI> {
    if (!data?.content?.trim()) {
      return throwError(() => new Error('Comment content is required'));
    }
    if (!data?.postId || data.postId <= 0) {
      return throwError(() => new Error('Invalid post ID'));
    }
    return this.commentController.createCommentForPost(data.postId, { content: data.content.trim(), postId: data.postId }).pipe(
      map(dto => this.mapToUI(dto)),
      // catchError(err => this.handleError(err, 'Failed to create comment'))
    );
  }

  getByPostPaged(postId: number, page: number, size: number): Observable<PaginatedComments> {
    if (!postId || postId <= 0) {
      return throwError(() => new Error('Invalid post ID'));
    }
    return this.commentController.getCommentsByPostPaged(postId, page, size).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, `Failed to fetch comments for post ${postId}`))
    );
  }

  getAll(filters?: { page?: number; size?: number }): Observable<PaginatedComments> {
    return this.commentController.getAllComments(filters?.page ?? 0, filters?.size ?? 10).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch all comments'))
    );
  }

  getMy(filters?: { page?: number; size?: number; sortBy?: string; sortDir?: string }): Observable<PaginatedComments> {
    return this.commentController.getMyComments(filters?.page ?? 0, filters?.size ?? 10, filters?.sortBy, filters?.sortDir).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch your comments'))
    );
  }

  getStats(): Observable<{ [key: string]: number }> {
    return this.commentController.getCommentStats().pipe(
      catchError(err => this.handleError(err, 'Failed to fetch comment stats'))
    );
  }

  // ─── WRITE ────────────────────────────────────────────────────────────────

  update(commentId: number, data: { content: string; postId: number }): Observable<CommentUI> {
    if (!commentId || commentId <= 0) {
      return throwError(() => new Error('Invalid comment ID'));
    }
    if (!data?.content?.trim()) {
      return throwError(() => new Error('Comment content is required'));
    }
    const req: CommentReqDto = { content: data.content.trim(), postId: data.postId };
    return this.commentController.editComment(commentId, req).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to update comment ${commentId}`))
    );
  }

  delete(commentId: number): Observable<void> {
    if (!commentId || commentId <= 0) {
      return throwError(() => new Error('Invalid comment ID'));
    }
    return this.commentController.deleteComment(commentId).pipe(
      catchError(err => this.handleError(err, `Failed to delete comment ${commentId}`))
    );
  }

  toggleLike(commentId: number): Observable<void> {
    if (!commentId || commentId <= 0) {
      return throwError(() => new Error('Invalid comment ID'));
    }

    return this.commentController.toggleLike(commentId).pipe(
      catchError(err => this.handleError(err, `Failed to toggle like on comment ${commentId}`))
    );
  }

  getReplies(commentId: number, page: number = 0, size: number = 5): Observable<PaginatedComments> {
    if (!commentId || commentId <= 0) {
      return throwError(() => new Error('Invalid comment ID'));
    }

    return this.commentController
      .getReplies(commentId, page, size)
      .pipe(
        map(response => this.mapPagedResponse(response)),
        catchError(err =>
          this.handleError(err, `Failed to fetch replies for comment ${commentId}`)
        )
      );
  }

  createReply(commentId: number, data: { content: string }): Observable<CommentUI> {
    if (!commentId || commentId <= 0) {
      return throwError(() => new Error('Invalid comment ID'));
    }

    if (!data?.content?.trim()) {
      return throwError(() => new Error('Reply content is required'));
    }

    return this.commentController
      .replyToComment(commentId, { content: data.content.trim(), postId: 0 })
      .pipe(
        map(dto => this.mapToUI(dto)),
        // catchError(err =>
        //   this.handleError(err, `Failed to create reply for comment ${commentId}`)
        // )
      );
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  mapToUI(dto: CommentResDto | null | undefined): CommentUI {
    if (!dto) throw new Error('Comment data is null or undefined');

    const firstName = dto.authorFirstName ?? '';
    const lastName = dto.authorLastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim() || dto.authorUsername || `User #${dto.userId}`;

    return {
      id: dto.id ?? 0,
      content: dto.content ?? '',
      postId: dto.postId ?? 0,
      userId: dto.userId ?? 0,
      authorId: dto.userId ?? 0,
      previewText: (dto.content ?? '').length > 50 ? dto.content!.substring(0, 50) + '...' : (dto.content ?? ''),
      authorUsername: dto.authorUsername,
      authorFullName: fullName,
      authorPfp: dto.authorPfp,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      likeCount: dto.likeCount ?? 0,
      isLiked: dto.isLiked ?? false,
      isReportedByCurrentUser: dto.isReportedByCurrentUser ?? false
    };
  }

  private mapPagedResponse(response: PageCommentResDto | null | undefined): PaginatedComments {
    if (!response) return { items: [], totalItems: 0, totalPages: 0, currentPage: 0, pageSize: 0 };
    return {
      items: (response.content ?? []).map(dto => this.mapToUI(dto)),
      totalItems: response.totalElements ?? 0,
      totalPages: response.totalPages ?? 0,
      currentPage: response.number ?? 0,
      pageSize: response.size ?? 0
    };
  }

  private handleError(error: any, message: string): Observable<never> {
    const formatted = formatApiError(error, message);
    console.groupCollapsed(`[CommentFacade] ${formatted}`);
    console.error('Operation:', message);
    console.error('Full Error:', error);
    if (error?.error) console.error('Backend Response:', error.error);
    console.groupEnd();
    return throwError(() => new Error(formatted));
  }
}