import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { CommentControllerService } from '../api/commentController.service';
import { CommentReqDto } from '../model/commentReqDto';
import { CommentResDto } from '../model/commentResDto';
import { PageCommentResDto } from '../model/pageCommentResDto';

import { CommentUI, PaginatedComments } from './models/comment.model';

/**
 * Comment Facade Service
 * 
 * Wraps the generated CommentControllerService with:
 * - Clean method names
 * - DTO to UI Model mapping
 * - Date string conversion to Date objects
 * - Null/undefined safety
 */
@Injectable({
  providedIn: 'root'
})
export class CommentFacadeService {
  private readonly commentController = inject(CommentControllerService);

  /**
   * Create a comment
   */
  create(data: { content: string; postId: number }): Observable<CommentUI> {
    if (!data?.content?.trim()) {
      return throwError(() => new Error('Comment content is required'));
    }

    if (!data?.postId || data.postId <= 0) {
      return throwError(() => new Error('Invalid post ID'));
    }

    const req: CommentReqDto = {
      content: data.content.trim(),
      postId: data.postId
    };

    return this.commentController.createComment(req).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, 'Failed to create comment'))
    );
  }

  /**
   * Get all comments with pagination
   */
  getAll(filters?: { page?: number; size?: number }): Observable<PaginatedComments> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;

    return this.commentController.getAllComments(page, size).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch all comments'))
    );
  }

  /**
   * Get current user's comments with pagination
   */
  getMy(filters?: { page?: number; size?: number; sortBy?: string; sortDir?: string }): Observable<PaginatedComments> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;

    return this.commentController.getMyComments(page, size, filters?.sortBy, filters?.sortDir).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch your comments'))
    );
  }

  /**
   * Get comment stats
   */
  getStats(): Observable<{ [key: string]: number }> {
    return this.commentController.getCommentStats().pipe(
      catchError(err => this.handleError(err, 'Failed to fetch comment stats'))
    );
  }

  /**
   * Get all comments for a post
   */
    getByPost(postId: number): Observable<CommentUI[]> {
      if (!postId || postId <= 0) {
        return throwError(() => new Error('Invalid post ID'));
      }

      return this.commentController.getCommentsByPost(postId).pipe(
        map((dtos: any) => {
          // Handle both array and paginated response
          const items = Array.isArray(dtos) ? dtos : (dtos?.content ?? dtos?.items ?? []);
          return items.map((dto: CommentResDto) => this.mapToUI(dto));
        }),
        catchError(err => this.handleError(err, `Failed to fetch comments for post ${postId}`))
      );
    }

  /**
   * Update a comment
   */
  update(commentId: number, data: { content: string; postId: number }): Observable<CommentUI> {
    if (!commentId || commentId <= 0) {
      return throwError(() => new Error('Invalid comment ID'));
    }

    if (!data?.content?.trim()) {
      return throwError(() => new Error('Comment content is required'));
    }

    const req: CommentReqDto = {
      content: data.content.trim(),
      postId: data.postId
    };

    return this.commentController.editComment(commentId, req).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to update comment ${commentId}`))
    );
  }

  /**
   * Delete a comment
   */
  delete(commentId: number): Observable<void> {
    if (!commentId || commentId <= 0) {
      return throwError(() => new Error('Invalid comment ID'));
    }

    return this.commentController.deleteComment(commentId).pipe(
      catchError(err => this.handleError(err, `Failed to delete comment ${commentId}`))
    );
  }

  /**
   * Map DTO to UI Model
   */
  private mapToUI(dto: CommentResDto | null | undefined): CommentUI {
    if (!dto) {
      throw new Error('Comment data is null or undefined');
    }

    return {
      id: dto.id ?? 0,
      content: dto.content ?? '',
      postId: dto.postId ?? 0,
      userId: dto.userId ?? 0,
      previewText: this.truncate(dto.content ?? '', 50)
    };
  }

  /**
   * Map paginated response
   */
  private mapPagedResponse(response: PageCommentResDto | null | undefined): PaginatedComments {
    if (!response) {
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: 0
      };
    }

    return {
      items: (response.content ?? []).map(dto => this.mapToUI(dto)),
      totalItems: response.totalElements ?? 0,
      totalPages: response.totalPages ?? 0,
      currentPage: response.number ?? 0,
      pageSize: response.size ?? 0
    };
  }

  /**
   * Truncate string to specified length
   */
  private truncate(text: string, length: number): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  /**
   * Handle errors with logging
   */
  private handleError(error: any, message: string): Observable<never> {
    console.error(`[CommentFacade] ${message}:`, error);
    const errorMsg = error?.message || error?.error?.message || message;
    return throwError(() => new Error(errorMsg));
  }
}
