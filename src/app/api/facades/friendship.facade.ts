import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ResponseHandlerService } from './response-handler.service';
import {
  FriendshipUI,
  PaginatedFriendships,
  PaginatedUserSummaries,
  UserSummaryUI
} from './models/friendship.model';

const JSON_ACCEPT = { httpHeaderAccept: 'application/json' } as any;

@Injectable({
  providedIn: 'root'
})
export class FriendshipFacadeService {
  private readonly http = inject(HttpClient);
  private readonly responseHandler = inject(ResponseHandlerService);

  private readonly baseUrl = 'http://localhost:8081';
  private readonly apiBase = `${this.baseUrl}/api/friendships`;

  // ─── ACTIONS ─────────────────────────────────────────────────────────────

  sendRequest(addresseeId: number): Observable<FriendshipUI> {
    if (!addresseeId || addresseeId <= 0) {
      return throwError(() => new Error('Invalid addressee ID'));
    }

    return this.http
      .post<any>(`${this.apiBase}/request/${encodeURIComponent(String(addresseeId))}`, null, JSON_ACCEPT)
      .pipe(
        map(dto => {
          this.responseHandler.logResponse(`sendRequest(${addresseeId})`, 'POST', dto);
          return this.mapToUI(dto);
        }),
        catchError(err => this.responseHandler.handleError(err, 'Failed to send friendship request'))
      );
  }

  acceptRequest(requesterId: number): Observable<FriendshipUI> {
    if (!requesterId || requesterId <= 0) {
      return throwError(() => new Error('Invalid requester ID'));
    }

    return this.http
      .put<any>(
        `${this.apiBase}/accept/${encodeURIComponent(String(requesterId))}`,
        {},
        { ...JSON_ACCEPT, observe: 'body' }
      )
      .pipe(
        map(dto => {
          this.responseHandler.logResponse(`acceptRequest(${requesterId})`, 'PUT', dto);
          return this.mapToUI(dto);
        }),
        catchError(err => this.responseHandler.handleError(err, 'Failed to accept friendship request'))
      );
  }

  deleteFriendship(friendId: number): Observable<void> {
    if (!friendId || friendId <= 0) {
      return throwError(() => new Error('Invalid friend ID'));
    }
    return this.http
      .delete<void>(`${this.apiBase}/${encodeURIComponent(String(friendId))}`, { ...JSON_ACCEPT, observe: 'body' })
      .pipe(
        map(() => {
          this.responseHandler.logResponse(`deleteFriendship(${friendId})`, 'DELETE', null);
        }),
        catchError(err => this.responseHandler.handleError(err, 'Failed to delete friendship'))
      );
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  getFriends(filters?: { page?: number; size?: number }): Observable<PaginatedUserSummaries> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;

    return this.http
      .get<any>(`${this.apiBase}/my-friends`, {
        params: { page, size },
        ...JSON_ACCEPT
      })
      .pipe(
        map(response => {
          this.responseHandler.logResponse('getFriends', 'GET', response);
          return this.mapUserSummaryPage(response);
        }),
        catchError(err => this.responseHandler.handleError(err, 'Failed to fetch friends'))
      );
  }

  getPendingRequests(filters?: { page?: number; size?: number }): Observable<PaginatedFriendships> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;

    return this.http
      .get<any>(`${this.apiBase}/pending`, {
        params: { page, size },
        ...JSON_ACCEPT
      })
      .pipe(
        map(response => {
          this.responseHandler.logResponse('getPendingRequests', 'GET', response);
          return this.mapFriendshipPage(response);
        }),
        catchError(err => this.responseHandler.handleError(err, 'Failed to fetch pending requests'))
      );
  }

  getSentRequests(filters?: { page?: number; size?: number }): Observable<PaginatedFriendships> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;

    return this.http
      .get<any>(`${this.apiBase}/sent`, {
        params: { page, size },
        ...JSON_ACCEPT
      })
      .pipe(
        map(response => {
          this.responseHandler.logResponse('getSentRequests', 'GET', response);
          return this.mapFriendshipPage(response);
        }),
        catchError(err => this.responseHandler.handleError(err, 'Failed to fetch sent requests'))
      );
  }

  isFriend(friendId: number): Observable<boolean> {
    if (!friendId || friendId <= 0) {
      return throwError(() => new Error('Invalid friend ID'));
    }

    return this.http
      .get<boolean>(`${this.apiBase}/is-friend/${encodeURIComponent(String(friendId))}`, JSON_ACCEPT)
      .pipe(
        map(response => {
          this.responseHandler.logResponse(`isFriend(${friendId})`, 'GET', response);
          return Boolean(response);
        }),
        catchError(err => this.responseHandler.handleError(err, 'Failed to check friendship status'))
      );
  }

  getSuggestions(filters?: { page?: number; size?: number; keyword?: string }): Observable<PaginatedUserSummaries> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;
    const keyword = filters?.keyword?.trim();

    return this.http
      .get<any>(`${this.apiBase}/suggestions`, {
        params: {
          page,
          size,
          ...(keyword ? { keyword } : {})
        },
        ...JSON_ACCEPT
      })
      .pipe(
        map(response => {
          this.responseHandler.logResponse('getSuggestions', 'GET', response);
          return this.mapUserSummaryPage(response);
        }),
        catchError(err => this.responseHandler.handleError(err, 'Failed to fetch friend suggestions'))
      );
  }

  // ─── BLOCK / UNBLOCK ──────────────────────────────────────────────────────

  blockUser(userId: number): Observable<UserSummaryUI> {
    if (!userId || userId <= 0) {
      return throwError(() => new Error('Invalid user ID'));
    }

    return this.http
      .put<any>(
        `${this.apiBase}/block/${encodeURIComponent(String(userId))}`,
        {},
        { ...JSON_ACCEPT, observe: 'body' }
      )
      .pipe(
        map(dto => {
          this.responseHandler.logResponse(`blockUser(${userId})`, 'PUT', dto);
          return this.mapUserSummary(dto) as UserSummaryUI;
        }),
        catchError(err => this.responseHandler.handleError(err, 'Failed to block user'))
      );
  }

  unblockUser(userId: number): Observable<UserSummaryUI> {
    if (!userId || userId <= 0) {
      return throwError(() => new Error('Invalid user ID'));
    }

    return this.http
      .put<any>(
        `${this.apiBase}/unblock/${encodeURIComponent(String(userId))}`,
        {},
        { ...JSON_ACCEPT, observe: 'body' }
      )
      .pipe(
        map(dto => {
          this.responseHandler.logResponse(`unblockUser(${userId})`, 'PUT', dto);
          return this.mapUserSummary(dto) as UserSummaryUI;
        }),
        catchError(err => this.responseHandler.handleError(err, 'Failed to unblock user'))
      );
  }

  getBlockedUsers(filters?: { page?: number; size?: number }): Observable<PaginatedUserSummaries> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 10;

    return this.http
      .get<any>(`${this.apiBase}/blocked`, {
        params: { page, size },
        ...JSON_ACCEPT
      })
      .pipe(
        map(response => {
          this.responseHandler.logResponse('getBlockedUsers', 'GET', response);
          return this.mapUserSummaryPage(response);
        }),
        catchError(err => this.responseHandler.handleError(err, 'Failed to fetch blocked users'))
      );
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  private mapToUI(dto: any): FriendshipUI {
    if (!dto) {
      throw new Error('Friendship data is null or undefined');
    }

    return {
      requesterId: dto.requesterId ?? 0,
      addresseeId: dto.addresseeId ?? 0,
      status: dto.status,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : null,
      requester: this.mapUserSummary(dto.requester),
      addressee: this.mapUserSummary(dto.addressee)
    };
  }

  private mapUserSummary(dto: any): UserSummaryUI | undefined {
    if (!dto) {
      return undefined;
    }

    const firstName = dto.firstName ?? '';
    const lastName = dto.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      id: dto.id ?? 0,
      username: dto.username,
      pfp: dto.pfp,
      firstName,
      lastName,
      fullName: fullName || dto.username
    };
  }

  private mapUserSummaryPage(response: any): PaginatedUserSummaries {
    if (!response) {
      return { items: [], totalItems: 0, totalPages: 0, currentPage: 0, pageSize: 0 };
    }

    const rawItems = Array.isArray(response)
      ? response
      : (response.content ?? response.items ?? response.users ?? []);

    const items = (rawItems ?? []).map((dto: any) => this.mapUserSummary(dto) as UserSummaryUI);

    return {
      items,
      totalItems: response.totalElements ?? items.length,
      totalPages: response.totalPages ?? (items.length ? 1 : 0),
      currentPage: response.number ?? 0,
      pageSize: response.size ?? items.length
    };
  }

  private mapFriendshipPage(response: any): PaginatedFriendships {
    if (!response) {
      return { items: [], totalItems: 0, totalPages: 0, currentPage: 0, pageSize: 0 };
    }

    return {
      items: (response.content ?? []).map((dto: any) => this.mapToUI(dto)),
      totalItems: response.totalElements ?? 0,
      totalPages: response.totalPages ?? 0,
      currentPage: response.number ?? 0,
      pageSize: response.size ?? 0
    };
  }
  searchFriends(query: string): Observable<UserSummaryUI[]> {
    return this.http.get<any[]>(`${this.apiBase}/search?q=${encodeURIComponent(query)}`).pipe(
      map(results => results.map(dto => this.mapUserSummary(dto) as UserSummaryUI))
    );
  }
}
