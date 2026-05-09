import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { FocusSessionControllerService } from '../api/focusSessionController.service';
import { FocusSessionReqDto } from '../model/focusSessionReqDto';
import { FocusSessionResDto } from '../model/focusSessionResDto';
import { PageFocusSessionResDto } from '../model/pageFocusSessionResDto';
import { FocusSessionUI } from './models/focus-session.model'
import { PaginatedSessions } from './models/paginated-sessions.model';
import { UserFocusRank } from './models/user-focus-rank.model';
import { formatApiError } from './models/api-error.model';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class FocusSessionFacadeService {
  private readonly focusSessionController = inject(FocusSessionControllerService);
  private readonly http = inject(HttpClient);

  // ─── ACTIONS ─────────────────────────────────────────────────────────────

  start(data: { title: string; timer: string; remainingSeconds: number }): Observable<FocusSessionUI> {
    if (!data?.title?.trim()) {
      return throwError(() => new Error('Title is required'));
    }
    if (!data?.remainingSeconds || data.remainingSeconds <= 0) {
      return throwError(() => new Error('Remaining seconds must be greater than 0'));
    }

    const req: FocusSessionReqDto = {
      title: data.title.trim(),
      timer: data.timer,
      remainingSeconds: data.remainingSeconds
    };

    return this.focusSessionController.start(req).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, 'Failed to start focus session'))
    );
  }

  complete(id: number, finalTimer: string): Observable<FocusSessionUI> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid session ID'));
    }
    if (!finalTimer?.trim()) {
      return throwError(() => new Error('Final timer value is required'));
    }

    return this.focusSessionController.complete(id, finalTimer).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to complete session ${id}`))
    );
  }

  pause(id: number, remainingSeconds: number): Observable<FocusSessionUI> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid session ID'));
    }
    if (remainingSeconds == null || remainingSeconds < 0) {
      return throwError(() => new Error('Remaining seconds must be >= 0'));
    }

    return this.focusSessionController.pause(id, remainingSeconds).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to pause session ${id}`))
    );
  }

  resume(id: number, remainingSeconds: number): Observable<FocusSessionUI> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid session ID'));
    }
    if (remainingSeconds == null || remainingSeconds < 0) {
      return throwError(() => new Error('Remaining seconds must be >= 0'));
    }

    return this.focusSessionController.resume(id, remainingSeconds).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, `Failed to resume session ${id}`))
    );
  }

  delete(id: number): Observable<void> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid session ID'));
    }
   
    return this.focusSessionController.deleteSession(id).pipe(
      catchError(err => this.handleError(err, `Failed to delete session ${id}`))
    );
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  getActive(): Observable<FocusSessionUI | null> {
    return this.focusSessionController.getActive().pipe(
      map(dto => {
        if (!dto) return null;
        return this.mapToUI(dto);
      }),
      catchError(err => this.handleError(err, 'Failed to fetch active session'))
    );
  }

  getMySessions(filters?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Observable<PaginatedSessions> {
    return this.focusSessionController
      .getMySessions(
        filters?.page ?? 0,
        filters?.size ?? 10,
        filters?.sortBy,
        filters?.sortDir
      )
      .pipe(
        map(res => this.mapPagedResponse(res)),
        catchError(err => this.handleError(err, 'Failed to fetch my sessions'))
      );
  }

  getByUser(userId: number): Observable<FocusSessionUI[]> {
    if (!userId || userId <= 0) {
      return throwError(() => new Error('Invalid user ID'));
    }

    return this.focusSessionController.getUserSessions(userId).pipe(
      map(dtos => dtos.map(dto => this.mapToUI(dto))),
      catchError(err => this.handleError(err, `Failed to fetch sessions for user ${userId}`))
    );
  }

  getByUserPaginated(userId: number, filters?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Observable<PaginatedSessions> {
    if (!userId || userId <= 0) {
      return throwError(() => new Error('Invalid user ID'));
    }

    return this.focusSessionController
      .getUserSessionsPaginated(
        userId,
        filters?.page ?? 0,
        filters?.size ?? 10,
        filters?.sortBy,
        filters?.sortDir
      )
      .pipe(
        map(res => this.mapPagedResponse(res)),
        catchError(err => this.handleError(err, `Failed to fetch paginated sessions for user ${userId}`))
      );
  }

  getStats(): Observable<{ [key: string]: number }> {
    return this.focusSessionController.getFocusStats().pipe(
      catchError(err => this.handleError(err, 'Failed to fetch focus stats'))
    );
  }

  getTopUsers(): Observable<UserFocusRank[]> {
    return this.focusSessionController.getTopFocusUsers().pipe(
      map(dtos => (dtos ?? []).map(dto => ({
        userId: dto.userId ?? 0,
        username: dto.username ?? 'Unknown',
        totalHours: dto.totalHours ?? 0
      }))),
      catchError(err => this.handleError(err, 'Failed to fetch top focus users'))
    );
  }

  BASE_URL = 'http://localhost:8081';

  getFocusTrends(): Observable<{ date: string; count: number }[]> {
    return this.http.get<{ date: string; count: number }[]>(
      `${this.BASE_URL}/api/focus-sessions/stats/trends`
    ).pipe(catchError(err => this.handleError(err, 'Failed to fetch focus trends')));
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  private mapToUI(dto: FocusSessionResDto | null | undefined): FocusSessionUI {
    if (!dto) {
      throw new Error('Session data is null or undefined');
    }

    return {
      id: dto.id ?? 0,
      userId: dto.userId ?? 0,
      title: dto.title ?? 'Focus Session',
      timer: dto.timer ?? '00:00:00',
      status: (dto.status as 'ACTIVE' | 'PAUSED' | 'COMPLETED') ?? 'ACTIVE',
      remainingSeconds: dto.remainingSeconds ?? 0,
      lastUpdated: dto.lastUpdated,
      displayDuration: dto.timer ?? '00:00:00'
    };
  }

  private mapPagedResponse(response: PageFocusSessionResDto | null | undefined): PaginatedSessions {
    if (!response) {
      return { items: [], totalItems: 0, totalPages: 0, currentPage: 0, pageSize: 0 };
    }

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
    console.groupCollapsed(`[FocusSessionFacade] ${formatted}`);
    console.error('Operation:', message);
    console.error('Full Error:', error);
    if (error?.error) console.error('Backend Response:', error.error);
    console.groupEnd();
    return throwError(() => new Error(formatted));
  }
}