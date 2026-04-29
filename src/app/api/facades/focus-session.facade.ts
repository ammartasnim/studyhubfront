import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { FocusSessionControllerService } from '../generated/api/focusSessionController.service';
import { FocusSessionReqDto } from '../generated/model/focusSessionReqDto';
import { FocusSessionResDto } from '../generated/model/focusSessionResDto';

import { FocusSessionUI } from './models/focus-session.model';

const JSON_ACCEPT = { httpHeaderAccept: 'application/json' } as any;

@Injectable({
  providedIn: 'root'
})
export class FocusSessionFacadeService {
  private readonly focusSessionController = inject(FocusSessionControllerService);

  create(data: { duration: number; title?: string }): Observable<FocusSessionUI> {
    if (!data?.duration || data.duration <= 0) {
      return throwError(() => new Error('Duration must be greater than 0'));
    }

    const req: FocusSessionReqDto = {
      title: data.title?.trim() || 'Focus Session',
      timer: this.formatDuration(data.duration)
    };

    return this.focusSessionController.createSession(req, 'body', false, JSON_ACCEPT).pipe(
      map(dto => this.mapToUI(dto)),
      catchError(err => this.handleError(err, 'Failed to create focus session'))
    );
  }

  getByUser(userId: number): Observable<FocusSessionUI[]> {
    if (!userId || userId <= 0) {
      return throwError(() => new Error('Invalid user ID'));
    }

    return this.focusSessionController.getUserSessions(userId, undefined, undefined, undefined, undefined, 'body', false, JSON_ACCEPT).pipe(
      map((dtos: any) => {
        const items = Array.isArray(dtos) ? dtos : (dtos?.content ?? dtos?.items ?? []);
        return items.map((dto: FocusSessionResDto) => this.mapToUI(dto));
      }),
      catchError(err => this.handleError(err, `Failed to fetch sessions for user ${userId}`))
    );
  }

  getMySessions(page = 0, size = 10): Observable<FocusSessionUI[]> {
    return this.focusSessionController.getMySessions(page, size, undefined, undefined, 'body', false, JSON_ACCEPT).pipe(
      map((dtos: any) => {
        const items = Array.isArray(dtos) ? dtos : (dtos?.content ?? dtos?.items ?? []);
        return items.map((dto: FocusSessionResDto) => this.mapToUI(dto));
      }),
      catchError(err => this.handleError(err, 'Failed to fetch my sessions'))
    );
  }

  delete(sessionId: number): Observable<void> {
    if (!sessionId || sessionId <= 0) {
      return throwError(() => new Error('Invalid session ID'));
    }

    return this.focusSessionController.deleteSession(sessionId, 'body', false, JSON_ACCEPT).pipe(
      catchError(err => this.handleError(err, `Failed to delete session ${sessionId}`))
    );
  }

  private mapToUI(dto: FocusSessionResDto | null | undefined): FocusSessionUI {
    if (!dto) {
      throw new Error('Focus session data is null or undefined');
    }

    return {
      id: dto.id ?? 0,
      userId: dto.userId ?? 0,
      title: dto.title ?? 'Focus Session',
      timer: dto.timer ?? '00:00:00',
      displayDuration: dto.timer ?? '00:00:00'
    };
  }

  private formatDuration(minutes: number): string {
    if (!minutes || minutes <= 0) return '00:00:00';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return [hours, mins, 0]
      .map(v => String(v).padStart(2, '0'))
      .join(':');
  }

  private handleError(error: any, message: string): Observable<never> {
    console.error(`[FocusSessionFacade] ${message}:`, error);
    const errorMsg = error?.message || error?.error?.message || message;
    return throwError(() => new Error(errorMsg));
  }
}