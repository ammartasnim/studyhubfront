import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { CommunityControllerService } from '../api/communityController.service';
import { CommunityReqDto } from '../model/communityReqDto';
import { CommunityResDto } from '../model/communityResDto';
import { PageCommunityResDto } from '../model/pageCommunityResDto';
import { CommunityUI, PaginatedCommunities, ModeratorInfo } from './models/community.model';
import { PostUI } from './models/post.model';
import { formatApiError } from './models/api-error.model';

export interface CommunityMemberUI {
  userId: number;
  username: string;
  fullName: string;
  pfp?: string;
  xpPts: number;
  level: number;
  isModerator: boolean;
  warningCount: number;
}

export interface PaginatedMembers {
  items: CommunityMemberUI[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

@Injectable({ providedIn: 'root' })
export class CommunityFacadeService {
  private readonly communityController = inject(CommunityControllerService);
  private readonly http = inject(HttpClient);

  private get basePath(): string {
    return (this.communityController as any)['configuration']?.basePath ?? 'http://localhost:8081';
  }

  // ─── COMMUNITY CRUD ───────────────────────────────────────────────────────

  getAll(filters?: { title?: string; description?: string; minMembers?: number; page?: number; size?: number; sortBy?: string; sortDir?: string }): Observable<PaginatedCommunities> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;
    const sortBy = filters?.sortBy ?? 'id';
    const sortDir = filters?.sortDir ?? 'asc';
    return this.communityController.getAllCommunities(filters?.title, filters?.description, filters?.minMembers, page, size, sortBy, sortDir).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch communities'))
    );
  }

  getById(id: number): Observable<CommunityUI> {
    if (!id || id <= 0) return throwError(() => new Error('Invalid community ID'));
    return this.communityController.getCommunityById(id).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to fetch community ${id}`))
    );
  }

  create(data: { title: string; description: string; category?: string }): Observable<CommunityUI> {
    if (!data?.title?.trim() || !data?.description?.trim()) {
      return throwError(() => new Error('Title and description are required'));
    }
    const req: CommunityReqDto = { title: data.title.trim(), description: data.description.trim(), category: data.category ?? '' };
    return this.communityController.createCommunity(req).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, 'Failed to create community'))
    );
  }

  update(id: number, data: { title: string; description: string; category?: string }): Observable<CommunityUI> {
    if (!id || id <= 0) return throwError(() => new Error('Invalid community ID'));
    const req: CommunityReqDto = { title: data.title.trim(), description: data.description.trim(), category: data.category };
    return this.communityController.updateCommunity(id, req).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to update community ${id}`))
    );
  }

  delete(id: number): Observable<void> {
    if (!id || id <= 0) return throwError(() => new Error('Invalid community ID'));
    return this.communityController.deleteCommunity(id).pipe(
      catchError(err => this.handleError(err, `Failed to delete community ${id}`))
    );
  }

  getMy(filters?: { page?: number; size?: number; sortBy?: string; sortDir?: string }): Observable<PaginatedCommunities> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;
    const sortBy = filters?.sortBy ?? 'id';
    const sortDir = filters?.sortDir ?? 'asc';
    return this.communityController.getMyCommunities(page, size, sortBy, sortDir).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch joined communities'))
    );
  }

  getMyCreated(filters?: { page?: number; size?: number; sortBy?: string; sortDir?: string }): Observable<PaginatedCommunities> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;
    const sortBy = filters?.sortBy ?? 'id';
    const sortDir = filters?.sortDir ?? 'asc';
    return this.communityController.getMyCreatedCommunities(page, size, sortBy, sortDir).pipe(
      map(response => this.mapPagedResponse(response)),
      catchError(err => this.handleError(err, 'Failed to fetch created communities'))
    );
  }

  getStats(): Observable<{ [key: string]: number }> {
    return this.communityController.getCommunityStats().pipe(
      catchError(err => this.handleError(err, 'Failed to fetch stats'))
    );
  }

  getTop(): Observable<CommunityUI[]> {
    return this.communityController.getTopCommunities().pipe(
      map(dtos => (dtos ?? []).map(dto => this.mapToUI(dto))),
      catchError(err => this.handleError(err, 'Failed to fetch top communities'))
    );
  }

  // ─── MODERATOR MANAGEMENT ─────────────────────────────────────────────────

  addModerator(communityId: number, userId: number, permissions: string[]): Observable<void> {
    return this.http.post<void>(`${this.basePath}/api/communities/${communityId}/moderators`, { userId, permissions }).pipe(
      catchError(err => this.handleError(err, 'Failed to add moderator'))
    );
  }

  removeModerator(communityId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.basePath}/api/communities/${communityId}/moderators/${userId}`).pipe(
      catchError(err => this.handleError(err, 'Failed to remove moderator'))
    );
  }

  updateModeratorPermissions(communityId: number, userId: number, permissions: string[]): Observable<void> {
    return this.http.put<void>(`${this.basePath}/api/communities/${communityId}/moderators/${userId}/permissions`, { permissions }).pipe(
      catchError(err => this.handleError(err, 'Failed to update permissions'))
    );
  }

  transferOwnership(communityId: number, newOwnerId: number): Observable<void> {
    return this.http.put<void>(`${this.basePath}/api/communities/${communityId}/transfer-ownership`, { newOwnerId }).pipe(
      catchError(err => this.handleError(err, 'Failed to transfer ownership'))
    );
  }

  // ─── MEMBER MANAGEMENT ────────────────────────────────────────────────────

  getMembers(communityId: number, page = 0, size = 20): Observable<PaginatedMembers> {
    return this.http.get<any>(`${this.basePath}/api/communities/${communityId}/members?page=${page}&size=${size}`).pipe(
      map(response => {
        const rawList = Array.isArray(response) ? response : (response.content ?? []);
        return {
          items: rawList.map((m: any) => ({
            userId: m.userId,
            username: m.username,
            fullName: m.fullName,
            pfp: m.pfp,
            xpPts: m.xpPts,
            level: m.level,
            isModerator: m.isModerator,
            warningCount: m.warningCount
          })),
          totalItems: response.totalElements ?? rawList.length,
          totalPages: response.totalPages ?? 1,
          currentPage: response.number ?? 0
        };
      }),
      catchError(err => this.handleError(err, 'Failed to fetch members'))
    );
  }

  getMembersPreview(communityId: number): Observable<CommunityMemberUI[]> {
    return this.http.get<any[]>(`${this.basePath}/api/communities/${communityId}/members/preview`).pipe(
      map(list => list.map(m => ({
        userId: m.userId,
        username: m.username,
        fullName: m.fullName,
        pfp: m.pfp,
        xpPts: m.xpPts,
        level: m.level,
        isModerator: m.isModerator,
        warningCount: 0
      }))),
      catchError(err => this.handleError(err, 'Failed to fetch members preview'))
    );
  }

  getMembersPublic(communityId: number, page = 0, size = 10): Observable<PaginatedMembers> {
    return this.http.get<any>(`${this.basePath}/api/communities/${communityId}/members/all?page=${page}&size=${size}`).pipe(
      map(response => ({
        items: (response.content ?? []).map((m: any) => ({
          userId: m.userId,
          username: m.username,
          fullName: m.fullName,
          pfp: m.pfp,
          xpPts: m.xpPts,
          level: m.level,
          isModerator: m.isModerator,
          warningCount: m.warningCount
        })),
        totalItems: response.totalElements ?? 0,
        totalPages: response.totalPages ?? 0,
        currentPage: response.number ?? 0
      })),
      catchError(err => this.handleError(err, 'Failed to fetch public members'))
    );
  }

  getBannedMembers(communityId: number): Observable<CommunityMemberUI[]> {
    return this.http.get<any[]>(`${this.basePath}/api/communities/${communityId}/banned`).pipe(
      map(list => list.map(m => ({
        userId: m.userId,
        username: m.username,
        fullName: m.fullName,
        pfp: m.pfp,
        xpPts: m.xpPts,
        level: m.level,
        isModerator: false,
        warningCount: 0
      }))),
      catchError(err => throwError(() => new Error(err?.error?.message || 'Failed to fetch banned members')))
    );
  }

  banMember(communityId: number, userId: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.basePath}/api/communities/${communityId}/ban`, { userId, reason }).pipe(
      catchError(err => this.handleError(err, 'Failed to ban member'))
    );
  }

  unbanMember(communityId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.basePath}/api/communities/${communityId}/ban/${userId}`).pipe(
      catchError(err => this.handleError(err, 'Failed to unban member'))
    );
  }

  warnMember(communityId: number, userId: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.basePath}/api/communities/${communityId}/warn`, { userId, reason }).pipe(
      catchError(err => this.handleError(err, 'Failed to warn member'))
    );
  }

  // ─── JOIN / LEAVE ─────────────────────────────────────────────────────────

  join(communityId: number): Observable<void> {
    return this.http.post<void>(`${this.basePath}/api/communities/${communityId}/join`, {}).pipe(
      catchError(err => this.handleError(err, 'Failed to join community'))
    );
  }

  leave(communityId: number): Observable<void> {
    return this.http.delete<void>(`${this.basePath}/api/communities/${communityId}/leave`).pipe(
      catchError(err => this.handleError(err, 'Failed to leave community'))
    );
  }

  // ─── POST APPROVAL ────────────────────────────────────────────────────────

  getPendingPosts(communityId: number): Observable<PostUI[]> {
    return this.http.get<any[]>(`${this.basePath}/api/posts/community/${communityId}/pending`).pipe(
      map(list => list.map(dto => this.mapPostToUI(dto))),
      catchError(err => this.handleError(err, 'Failed to fetch pending posts'))
    );
  }

  // ─── MAPPERS ──────────────────────────────────────────────────────────────

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

  private mapPostToUI(dto: any): PostUI {
    const firstName = dto.userFirstName ?? '';
    const lastName = dto.userLastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim() || dto.userUsername || 'Unknown Author';
    const images = Array.isArray(dto.imgs) ? dto.imgs.filter((img: any) => !!img) : [];
    return {
      id: dto.id ?? 0,
      title: dto.title ?? 'Untitled Post',
      content: dto.content ?? '',
      images,
      authorUsername: dto.userUsername ?? 'unknown',
      authorFirstName: firstName,
      authorLastName: lastName,
      authorPfp: dto.userPfp ?? undefined,
      communityTitle: dto.communityTitle ?? '',
      authorFullName: fullName,
      previewText: (dto.content ?? '').length > 100 ? dto.content.substring(0, 100) + '...' : (dto.content ?? ''),
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

  private mapPagedResponse(response: PageCommunityResDto | null | undefined): PaginatedCommunities {
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
    console.groupCollapsed(`[CommunityFacade] ${formatted}`);
    console.error('Operation:', message);
    console.error('Full Error:', error);
    if (error?.error) console.error('Backend Response:', error.error);
    console.groupEnd();
    return throwError(() => new Error(formatted));
  }
}