import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { PostControllerService } from '../api/postController.service';
import { PostReqDto } from '../model/postReqDto';
import { PostResDto } from '../model/postResDto';
import { PagePostResDto } from '../model/pagePostResDto';
import { Pageable } from '../model/pageable';

import { PostUI, PaginatedPosts } from './models/post.model';
import { HttpClient } from '@angular/common/http';
import { formatApiError } from './models/api-error.model';

/**
 * Post Facade Service
 * 
 * Wraps the generated PostControllerService with:
 * - Clean method names (getAll, getById, create, update, delete)
 * - DTO to UI Model mapping
 * - Null/undefined safety
 * - Consistent error handling
 * - Image array handling
 */
@Injectable({
  providedIn: 'root'
})
export class PostFacadeService {
  private readonly postController = inject(PostControllerService);
  private readonly http = inject(HttpClient);

  /**
   * Get all posts with pagination
   */
  getAll(filters?: { page?: number; size?: number; title?: string }): Observable<PaginatedPosts> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;

    const pageable: Pageable = {
      page: page,
      size: size
    };

    return this.postController.getAllPosts(pageable, filters?.title).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch posts'))
    );
  }

  /**
   * Get post by ID
   */
  getById(id: number): Observable<PostUI> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid post ID'));
    }

    return this.postController.getPostById(id).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to fetch post with ID ${id}`))
    );
  }

  /**
   * Create a new post
   */
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

  /**
   * Update a post
   */
  update(id: number, data: { title: string; content: string; communityId?: number }): Observable<PostUI> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid post ID'));
    }

    if (!data?.title?.trim() || !data?.content?.trim()) {
      return throwError(() => new Error('Title and content are required'));
    }

    const req: PostReqDto = {
      title: data.title.trim(),
      content: data.content.trim(),
      communityId: data.communityId
    };

    return this.postController.updatePost(id, req).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to update post with ID ${id}`))
    );
  }

  /**
   * Delete a post
   */
  delete(id: number): Observable<void> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid post ID'));
    }

    return this.postController.deletePost(id).pipe(
      catchError(err => this.handleError(err, `Failed to delete post with ID ${id}`))
    );
  }

   /**
    * Get current user's posts
    */
   getMy(filters?: { page?: number; size?: number }): Observable<PaginatedPosts> {
     const page = filters?.page ?? 0;
     const size = filters?.size ?? 10;

     const pageable: Pageable = {
       page: page,
       size: size
     };

     return this.postController.getMyPosts(pageable).pipe(
       map(response => this.mapPagedResponse(response)),
       catchError(err => this.handleError(err, 'Failed to fetch your posts'))
     );
   }

   /**
    * Get posts by community
    */
getByCommunity(communityId: number, filters?: { page?: number; size?: number }): Observable<PaginatedPosts> {
  const pageable: Pageable = {
    page: filters?.page ?? 0,
    size: filters?.size ?? 10
  };

  return this.postController.getPostsByCommunity(communityId, pageable).pipe(
    switchMap((response: any) => {
      // If the response is a Blob, we must read it as text and parse it
      if (response instanceof Blob) {
        return from(response.text()).pipe(
          map(text => JSON.parse(text))
        );
      }
      // If it's already JSON, just wrap it back in an observable
      return from([response]);
    }),
    map(jsonResponse => this.mapPagedResponse(jsonResponse)),
    catchError(err => this.handleError(err, `Failed to fetch posts`))
  );
}
   /**
    * Get posts by user
    */
   getByUser(userId: number, filters?: { page?: number; size?: number }): Observable<PaginatedPosts> {
     if (!userId || userId <= 0) {
       return throwError(() => new Error('Invalid user ID'));
     }

     const page = filters?.page ?? 0;
     const size = filters?.size ?? 10;

     const pageable: Pageable = {
       page: page,
       size: size
     };

     return this.postController.getPostsByUser(userId, pageable).pipe(
       map(response => this.mapPagedResponse(response)),
       catchError(err => this.handleError(err, `Failed to fetch posts for user ${userId}`))
     );
   }

  /**
   * Get the feed: posts from communities the current user is a member of
   */
  getFeed(filters?: { page?: number; size?: number }): Observable<PaginatedPosts> {
    const pageable: Pageable = {
      page: filters?.page ?? 0,
      size: filters?.size ?? 20
    };

    return this.postController.getFeed(pageable).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch feed'))
    );
  }

  /**
   * Toggle like on a post
   */
  toggleLike(postId: number): Observable<void> {
    if (!postId || postId <= 0) {
      return throwError(() => new Error('Invalid post ID'));
    }

    return this.postController.toggleLike(postId).pipe(
      catchError(err => this.handleError(err, `Failed to toggle like on post ${postId}`))
    );
  }

  /**
   * Approve a post (admin/moderator)
   */
  approve(id: number): Observable<PostUI> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid post ID'));
    }

    return this.postController.approvePost(id).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to approve post ${id}`))
    );
  }

  /**
   * Flag a post as inappropriate
   */
  flag(id: number): Observable<PostUI> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid post ID'));
    }

    return this.postController.flagPost(id).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to flag post ${id}`))
    );
  }

  /**
   * Map DTO to UI Model
   */
  private mapToUI(dto: PostResDto | null | undefined): PostUI {
    if (!dto) {
      throw new Error('Post data is null or undefined');
    }

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
      previewText: this.truncate(dto.content ?? '', 100),
      imageCount: images.length,
      likeCount: dto.likeCount ?? 0,
      commentCount: dto.commentCount ?? 0,
      isLiked: dto.liked ?? false,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
      status: dto.status ?? '',
      flagCount: dto.flagCount ?? 0,
      isFlaggedByCurrentUser: dto.isFlaggedByCurrentUser ?? false
    };
  }

  /**
   * Map paginated response
   */
private mapPagedResponse(response: any): PaginatedPosts {
  // 1. Extract the raw list from Spring's 'content' key
  const rawContent = response.content || [];

  // 2. Transform each DTO into the PostUI model
  // This ensures authorFullName, previewText, and Dates are correctly set
  const mappedItems = rawContent.map((dto: PostResDto) => this.mapToUI(dto));

  return {
    items: mappedItems,
    totalItems: response.totalElements ?? 0,
    totalPages: response.totalPages ?? 0,
    currentPage: response.number ?? 0,
    pageSize: response.size ?? 10
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
    const formatted = formatApiError(error, message);
    console.groupCollapsed(`[PostFacade] ${formatted}`);
    console.error('Operation:', message);
    console.error('Full Error:', error);
    if (error?.error) console.error('Backend Response:', error.error);
    console.groupEnd();
    return throwError(() => new Error(formatted));
  }
  markSeen(postIds: number[]): Observable<void> {
    return this.http.post<void>(
        `${this.postController['configuration'].basePath}/api/posts/seen`,
        postIds
    ).pipe(
        catchError(err => this.handleError(err, 'Failed to mark posts as seen'))
    );
}

getPostStats(): Observable<{ total: number; flagged: number; pending: number }> {
  return this.http.get<{ total: number; flagged: number; pending: number }>(
    `${this.postController['configuration'].basePath}/api/posts/stats/count`
  ).pipe(
    catchError(err => this.handleError(err, 'Failed to fetch post stats'))
  );
}

getByStatus(status: string, page = 0, size = 10): Observable<PaginatedPosts> {
  return this.http.get<any>(
    `${this.postController['configuration'].basePath}/api/posts/status/${status}`,
    { params: { page, size } }
  ).pipe(
    map(res => this.mapPagedResponse(res)),
    catchError(err => this.handleError(err, `Failed to fetch posts with status ${status}`))
  );
}
  
}
