import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { CommunityControllerService } from '../api/communityController.service';
import { CommunityReqDto } from '../model/communityReqDto';
import { CommunityResDto } from '../model/communityResDto';
import { PageCommunityResDto } from '../model/pageCommunityResDto';

import { CommunityUI, PaginatedCommunities } from './models/community.model';
import { ResponseHandlerService } from './response-handler.service';

/**
 * Community Facade Service
 * 
 * Wraps the generated CommunityControllerService with:
 * - Clean, stable method names
 * - DTO to UI Model mapping
 * - Null/undefined safety
 * - Consistent error handling via ResponseHandlerService
 * - JSON response validation
 */
@Injectable({
  providedIn: 'root'
})
export class CommunityFacadeService {
  private readonly communityController = inject(CommunityControllerService);
  private readonly responseHandler = inject(ResponseHandlerService);

  /**
   * Get all communities with pagination and filtering
   */
  getAll(
    filters?: {
      title?: string;
      description?: string;
      minMembers?: number;
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: string;
    }
  ): Observable<PaginatedCommunities> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;
    const sortBy = filters?.sortBy ?? 'id';
    const sortDir = filters?.sortDir ?? 'asc';

    return this.communityController.getAllCommunities(
      filters?.title,
      filters?.description,
      filters?.minMembers,
      page,
      size,
      sortBy,
      sortDir
    ).pipe(
      map(response => {
        this.responseHandler.logResponse('getAllCommunities', 'GET', response);
        if (!this.responseHandler.validateJsonResponse(response)) {
          throw new Error('Invalid JSON response from server');
        }
        return this.mapPagedResponse(response);
      }),
      catchError(err => this.responseHandler.handleError(err, 'Failed to fetch communities'))
    );
  }

  /**
   * Get community by ID
   */
  getById(id: number): Observable<CommunityUI> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid community ID'));
    }

    return this.communityController.getCommunityById(id).pipe(
      map(dto => {
        this.responseHandler.logResponse(`getCommunityById(${id})`, 'GET', dto);
        if (!this.responseHandler.validateJsonResponse(dto)) {
          throw new Error('Invalid JSON response from server');
        }
        return this.mapToUI(dto);
      }),
      catchError(err => this.responseHandler.handleError(err, `Failed to fetch community with ID ${id}`))
    );
  }

  /**
   * Create a new community
   */


create(data: { title: string; description: string; category?: string }): Observable<CommunityUI> {
  if (!data?.title?.trim() || !data?.description?.trim()) {
    return throwError(() => new Error('Title and description are required'));
  }

  const req: CommunityReqDto = {
    title: data.title.trim(),
    description: data.description.trim(),
    category: data.category ?? ''
  };

  return this.communityController.createCommunity(req).pipe(
    map(dto => {
      if (!this.responseHandler.validateJsonResponse(dto)) {
        throw new Error('Invalid JSON response from server');
      }
      return this.mapToUI(dto);
    }),
    catchError(err => this.responseHandler.handleError(err, 'Failed to create community'))
  );
}

  /**
   * Update a community
   */
  update(id: number, data: { title: string; description: string }): Observable<CommunityUI> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid community ID'));
    }

    if (!data?.title?.trim() || !data?.description?.trim()) {
      return throwError(() => new Error('Title and description are required'));
    }

    const req: CommunityReqDto = {
      title: data.title.trim(),
      description: data.description.trim()
    };

    return this.communityController.updateCommunity(id, req).pipe(
      map(dto => {
        this.responseHandler.logResponse(`updateCommunity(${id})`, 'PUT', dto);
        if (!this.responseHandler.validateJsonResponse(dto)) {
          throw new Error('Invalid JSON response from server');
        }
        return this.mapToUI(dto);
      }),
      catchError(err => this.responseHandler.handleError(err, `Failed to update community with ID ${id}`))
    );
  }

  /**
   * Delete a community
   */
  delete(id: number): Observable<void> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid community ID'));
    }

    return this.communityController.deleteCommunity(id).pipe(
      catchError(err => this.responseHandler.handleError(err, `Failed to delete community with ID ${id}`))
    );
  }

  /**
   * Get user's created communities
   */
  getMyCreated(
    filters?: { page?: number; size?: number; sortBy?: string; sortDir?: string }
  ): Observable<PaginatedCommunities> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;
    const sortBy = filters?.sortBy ?? 'id';
    const sortDir = filters?.sortDir ?? 'asc';

    return this.communityController.getMyCreatedCommunities(page, size, sortBy, sortDir).pipe(
      map(response => {
        this.responseHandler.logResponse('getMyCreatedCommunities', 'GET', response);
        if (!this.responseHandler.validateJsonResponse(response)) {
          throw new Error('Invalid JSON response from server');
        }
        return this.mapPagedResponse(response);
      }),
      catchError(err => this.responseHandler.handleError(err, 'Failed to fetch created communities'))
    );
  }

  /**
   * Get user's joined communities
   */
  getMy(
    filters?: { page?: number; size?: number; sortBy?: string; sortDir?: string }
  ): Observable<PaginatedCommunities> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;
    const sortBy = filters?.sortBy ?? 'id';
    const sortDir = filters?.sortDir ?? 'asc';

    return this.communityController.getMyCommunities(page, size, sortBy, sortDir).pipe(
      map(response => {
        this.responseHandler.logResponse('getMyCommunities', 'GET', response);
        if (!this.responseHandler.validateJsonResponse(response)) {
          throw new Error('Invalid JSON response from server');
        }
        return this.mapPagedResponse(response);
      }),
      catchError(err => this.responseHandler.handleError(err, 'Failed to fetch joined communities'))
    );
  }

  /**
   * Get community stats (total count, etc.)
   */
  getStats(): Observable<{ [key: string]: number }> {
    return this.communityController.getCommunityStats().pipe(
      map(response => {
        this.responseHandler.logResponse('getCommunityStats', 'GET', response);
        return response ?? {};
      }),
      catchError(err => this.responseHandler.handleError(err, 'Failed to fetch community stats'))
    );
  }

  /**
   * Get top communities
   */
  getTop(): Observable<CommunityUI[]> {
    return this.communityController.getTopCommunities().pipe(
      map(dtos => {
        this.responseHandler.logResponse('getTopCommunities', 'GET', dtos);
        return (dtos ?? []).map(dto => this.mapToUI(dto));
      }),
      catchError(err => this.responseHandler.handleError(err, 'Failed to fetch top communities'))
    );
  }

  /**
   * Map DTO to UI Model
   */
private mapToUI(dto: CommunityResDto | null | undefined): CommunityUI {
  if (!dto) throw new Error('Community data is null or undefined');
  return {
    id: dto.id ?? 0,
    title: dto.title ?? 'Untitled Community',
    description: dto.description ?? '',
    nbrMembers: dto.nbrMembers ?? 0,
    ownerId: dto.ownerId ?? undefined,
    category: dto.category ?? undefined,
      moderators: (dto.moderators ?? []).map(m => ({
      userId: m.userId,
      username: m.username,
      fullName: m.fullName,
      permissions: m.permissions ?? []
}))
  };
}
  /**
   * Map paginated response
   */
  private mapPagedResponse(response: PageCommunityResDto | null | undefined): PaginatedCommunities {
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
}
