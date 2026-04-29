import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { PostControllerService } from '../generated/api/postController.service';
import { PostReqDto } from '../generated/model/postReqDto';
import { PostResDto } from '../generated/model/postResDto';
import { PagePostResDto } from '../generated/model/pagePostResDto';
import { Pageable } from '../generated/model/pageable';

import { PostUI, PaginatedPosts } from './models/post.model';

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
  create(data: { title: string; content: string; communityId?: number }): Observable<PostUI> {
    if (!data?.title?.trim() || !data?.content?.trim()) {
      return throwError(() => new Error('Title and content are required'));
    }

    const req: PostReqDto = {
      title: data.title.trim(),
      content: data.content.trim(),
      communityId: data.communityId
    };

    return this.postController.createPost(req).pipe(
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
     if (!communityId || communityId <= 0) {
       return throwError(() => new Error('Invalid community ID'));
     }

     const page = filters?.page ?? 0;
     const size = filters?.size ?? 10;

     const pageable: Pageable = {
       page: page,
       size: size
     };

     return this.postController.getPostsByCommunity(communityId, pageable).pipe(
       map(response => this.mapPagedResponse(response)),
       catchError(err => this.handleError(err, `Failed to fetch posts for community ${communityId}`))
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
      communityTitle: dto.communityTitle ?? 'General',
      authorFullName: fullName,
      previewText: this.truncate(dto.content ?? '', 100),
      imageCount: images.length,
      likeCount: dto.likeCount ?? 0,
      commentCount: dto.commentCount ?? 0,
      isLiked: dto.isLiked ?? false,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
      status: dto.status ?? ''
    };
  }

  /**
   * Map paginated response
   */
  private mapPagedResponse(response: PagePostResDto | null | undefined): PaginatedPosts {
    if (!response) {
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: 0
      };
    }

    const items = (response.content ?? []).map(dto => this.mapToUI(dto));

    return {
      items,
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
    console.error(`[PostFacade] ${message}:`, error);
    const errorMsg = error?.message || error?.error?.message || message;
    return throwError(() => new Error(errorMsg));
  }
  getFeed(filters?: { page?: number; size?: number }): Observable<PaginatedPosts> {
  const page = filters?.page ?? 0;
  const size = filters?.size ?? 10;

  const pageable: Pageable = {
    page: page,
    size: size
  };

  return this.postController.getFeed(pageable).pipe(
    map(response => this.mapPagedResponse(response)),
    catchError(err => this.handleError(err, 'Failed to fetch feed'))
  );
}
}
