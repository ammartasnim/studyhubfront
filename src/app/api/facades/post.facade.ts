import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { PostControllerService } from '../api/postController.service';
import { PostReqDto } from '../model/postReqDto';
import { PostResDto } from '../model/postResDto';
import { Pageable } from '../model/pageable';
import { PostUI, PaginatedPosts } from './models/post.model';
import { HttpClient } from '@angular/common/http';
import { formatApiError } from './models/api-error.model';

export interface ReportReqDto {
  reason: 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE_CONTENT' | 'MISINFORMATION' | 'HATE_SPEECH' | 'OTHER';
  additionalContext?: string;
}

export interface ReportResDto {
  id: number;
  reporterId: number;
  reporterUsername: string;
  targetType: 'POST' | 'COMMENT';
  targetId: number;
  targetPreview: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  additionalContext?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PostFacadeService {
  private readonly postController = inject(PostControllerService);
  private readonly http = inject(HttpClient);

  private get basePath(): string {
    return this.postController['configuration'].basePath ?? 'http://localhost:8081';
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  getAll(filters?: { page?: number; size?: number; title?: string }): Observable<PaginatedPosts> {
    const pageable: Pageable = { page: filters?.page ?? 0, size: filters?.size ?? 10 };
    return this.postController.getAllPosts(pageable, filters?.title).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch posts'))
    );
  }

  getById(id: number): Observable<PostUI> {
    if (!id || id <= 0) return throwError(() => new Error('Invalid post ID'));
    return this.postController.getPostById(id).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to fetch post ${id}`))
    );
  }

  getMy(filters?: { page?: number; size?: number }): Observable<PaginatedPosts> {
    const pageable: Pageable = { page: filters?.page ?? 0, size: filters?.size ?? 10 };
    return this.postController.getMyPosts(pageable).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch your posts'))
    );
  }

  getByCommunity(communityId: number, filters?: { page?: number; size?: number }): Observable<PaginatedPosts> {
    const pageable: Pageable = { page: filters?.page ?? 0, size: filters?.size ?? 10 };
    return this.postController.getPostsByCommunity(communityId, pageable).pipe(
      switchMap((response: any) => {
        if (response instanceof Blob) {
          return from(response.text()).pipe(map(text => JSON.parse(text)));
        }
        return from([response]);
      }),
      map(jsonResponse => this.mapPagedResponse(jsonResponse)),
      catchError(err => this.handleError(err, 'Failed to fetch posts'))
    );
  }

  getByUser(userId: number, filters?: { page?: number; size?: number }): Observable<PaginatedPosts> {
    if (!userId || userId <= 0) return throwError(() => new Error('Invalid user ID'));
    const pageable: Pageable = { page: filters?.page ?? 0, size: filters?.size ?? 10 };
    return this.postController.getPostsByUser(userId, pageable).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, `Failed to fetch posts for user ${userId}`))
    );
  }

  getFeed(filters?: { page?: number; size?: number }): Observable<PaginatedPosts> {
    const pageable: Pageable = { page: filters?.page ?? 0, size: filters?.size ?? 20 };
    return this.postController.getFeed(pageable).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch feed'))
    );
  }

  getPendingPosts(communityId: number): Observable<PostUI[]> {
    return this.http.get<any[]>(`${this.basePath}/api/posts/community/${communityId}/pending`).pipe(
      map(list => list.map(dto => this.mapToUI(dto))),
      catchError(err => this.handleError(err, 'Failed to fetch pending posts'))
    );
  }

  getPostStats(): Observable<{ total: number; pending: number }> {
    return this.http.get<{ total: number; pending: number }>(
      `${this.basePath}/api/posts/stats/count`
    ).pipe(catchError(err => this.handleError(err, 'Failed to fetch post stats')));
  }

  getByStatus(status: string, page = 0, size = 10): Observable<PaginatedPosts> {
    return this.http.get<any>(`${this.basePath}/api/posts/status/${status}`, { params: { page, size } }).pipe(
      map(res => this.mapPagedResponse(res)),
      catchError(err => this.handleError(err, `Failed to fetch posts with status ${status}`))
    );
  }

  // ─── CREATE / UPDATE / DELETE ─────────────────────────────────────────────

  create(data: { title: string; content: string; imgs?: Blob[]; communityId?: number }): Observable<PostUI> {
    if (!data?.title?.trim() || !data?.content?.trim()) {
      return throwError(() => new Error('Title and content are required'));
    }
    return this.postController.createPost(
      data.title.trim(),
      data.content.trim(),
      data.imgs,
      data.communityId != null ? String(data.communityId) : undefined
    ).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, 'Failed to create post'))
    );
  }

  update(id: number, data: { title: string; content: string; imgs?: File[] }): Observable<PostUI> {
    if (!id || id <= 0) return throwError(() => new Error('Invalid post ID'));
    if (!data?.title?.trim() || !data?.content?.trim()) {
      return throwError(() => new Error('Title and content are required'));
    }
    const formData = new FormData();
    formData.append('title', data.title.trim());
    formData.append('content', data.content.trim());
    if (data.imgs?.length) {
      data.imgs.forEach(img => formData.append('imgs', img));
    }
    return this.http.put<any>(`${this.basePath}/api/posts/${id}`, formData).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to update post ${id}`))
    );
  }

  delete(id: number): Observable<void> {
    if (!id || id <= 0) return throwError(() => new Error('Invalid post ID'));
    return this.postController.deletePost(id).pipe(
      catchError(err => this.handleError(err, `Failed to delete post ${id}`))
    );
  }

  // ─── MODERATION ───────────────────────────────────────────────────────────

  approve(id: number): Observable<PostUI> {
    if (!id || id <= 0) return throwError(() => new Error('Invalid post ID'));
    return this.postController.approvePost(id).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to approve post ${id}`))
    );
  }

  reject(id: number): Observable<void> {
    if (!id || id <= 0) return throwError(() => new Error('Invalid post ID'));
    return this.http.delete<void>(`${this.basePath}/api/posts/${id}/reject`).pipe(
      catchError(err => this.handleError(err, `Failed to reject post ${id}`))
    );
  }

  // ─── REPORTS ──────────────────────────────────────────────────────────────

  reportPost(postId: number, request: ReportReqDto): Observable<ReportResDto> {
    if (!postId || postId <= 0) return throwError(() => new Error('Invalid post ID'));
    return this.http.post<ReportResDto>(`${this.basePath}/api/reports/post/${postId}`, request).pipe(
      catchError(err => this.handleError(err, `Failed to report post ${postId}`))
    );
  }

  reportComment(commentId: number, request: ReportReqDto): Observable<ReportResDto> {
    if (!commentId || commentId <= 0) return throwError(() => new Error('Invalid comment ID'));
    return this.http.post<ReportResDto>(`${this.basePath}/api/reports/comment/${commentId}`, request).pipe(
      catchError(err => this.handleError(err, `Failed to report comment ${commentId}`))
    );
  }

  // ─── INTERACTIONS ─────────────────────────────────────────────────────────

  toggleLike(postId: number): Observable<void> {
    if (!postId || postId <= 0) return throwError(() => new Error('Invalid post ID'));
    return this.postController.toggleLike(postId).pipe(
      catchError(err => this.handleError(err, `Failed to toggle like on post ${postId}`))
    );
  }

  markSeen(postIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.basePath}/api/posts/seen`, postIds).pipe(
      catchError(err => this.handleError(err, 'Failed to mark posts as seen'))
    );
  }

  // ─── MAPPERS ──────────────────────────────────────────────────────────────

  mapToUI(dto: PostResDto | null | undefined): PostUI {
    if (!dto) throw new Error('Post data is null or undefined');
    const images = Array.isArray(dto.imgs) ? dto.imgs.filter(img => !!img) : [];
    const firstName = dto.userFirstName ?? '';
    const lastName = dto.userLastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim() || dto.userUsername || 'Unknown Author';
    return {
      id: dto.id ?? 0,
      title: dto.title ?? 'Untitled Post',
      content: dto.content ?? '',
      images,
      authorUsername: dto.userUsername ?? 'unknown',
      authorFirstName: firstName,
      authorLastName: lastName,
      authorPfp: dto.userPfp ?? undefined,
      communityTitle: dto.communityTitle ?? 'General',
      authorFullName: fullName,
      previewText: (dto.content ?? '').length > 100 ? dto.content!.substring(0, 100) + '...' : (dto.content ?? ''),
      imageCount: images.length,
      likeCount: dto.likeCount ?? 0,
      commentCount: dto.commentCount ?? 0,
      isLiked: dto.liked ?? false,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
      status: (dto.status as string) ?? '',
      isReportedByCurrentUser: dto.isReportedByCurrentUser ?? false
    };
  }

  private mapPagedResponse(response: any): PaginatedPosts {
    return {
      items: (response.content ?? []).map((dto: PostResDto) => this.mapToUI(dto)),
      totalItems: response.totalElements ?? 0,
      totalPages: response.totalPages ?? 0,
      currentPage: response.number ?? 0,
      pageSize: response.size ?? 10
    };
  }

  private handleError(error: any, message: string): Observable<never> {
    const formatted = formatApiError(error, message);
    console.groupCollapsed(`[PostFacade] ${formatted}`);
    console.error('Operation:', message);
    console.error('Full Error:', error);
    if (error?.error) console.error('Backend Response:', error.error);
    console.groupEnd();
    return throwError(() => new Error(formatted));
  }
  getMyReports(page = 0, size = 10): Observable<{ items: ReportResDto[]; totalItems: number; totalPages: number; currentPage: number; pageSize: number }> {
  return this.http.get<any>(`${this.basePath}/api/reports/my`, { params: { page, size } }).pipe(
    map(res => ({
      items: res.content ?? [],
      totalItems: res.totalElements ?? 0,
      totalPages: res.totalPages ?? 0,
      currentPage: res.number ?? 0,
      pageSize: res.size ?? size
    })),
    catchError(err => this.handleError(err, 'Failed to fetch your reports'))
  );
}
getGroupedPostReports(): Observable<any[]> {
  return this.http.get<any[]>(`${this.basePath}/api/reports/posts/grouped`).pipe(
    catchError(err => this.handleError(err, 'Failed to fetch grouped post reports'))
  );
}
}