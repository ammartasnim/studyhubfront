import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Client, Frame, IMessage, IStompSocket, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

import { environment } from '../../../environments/environment';

import { NotificationUI, PaginatedNotifications } from './models/notification.model';
import { formatApiError } from './models/api-error.model';

const JSON_ACCEPT = { httpHeaderAccept: 'application/json' } as any;

@Injectable({
  providedIn: 'root'
})
export class NotificationFacadeService {
  private readonly http = inject(HttpClient);
  private client?: Client;
  private connectionPromise?: Promise<void>;
  private isConnected = false;

  private readonly apiBase = `${environment.apiBaseUrl}/api/notifications`;

  // ─── REST ─────────────────────────────────────────────────────────────────

  getMyNotifications(filters?: { page?: number; size?: number }): Observable<PaginatedNotifications> {
    const page = filters?.page ?? 0;
    const size = filters?.size ?? 20;

    return this.http.get<any>(this.apiBase, { params: { page, size }, ...JSON_ACCEPT }).pipe(
      map(response => this.mapPage(response)),
      catchError(err => this.handleError(err, 'Failed to fetch notifications'))
    );
  }

  markRead(id: number): Observable<void> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid notification ID'));
    }

    return this.http.patch<void>(
      `${this.apiBase}/${encodeURIComponent(String(id))}/read`,
      {},
      { observe: 'body' as const }
    ).pipe(
      catchError(err => this.handleError(err, 'Failed to mark notification as read'))
    );
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(
      `${this.apiBase}/read-all`,
      {},
      { observe: 'body' as const }
    ).pipe(
      catchError(err => this.handleError(err, 'Failed to mark all notifications as read'))
    );
  }

  countUnread(): Observable<number> {
    return this.http.get<number>(`${this.apiBase}/unread-count`, JSON_ACCEPT).pipe(
      map(value => Number(value ?? 0)),
      catchError(err => this.handleError(err, 'Failed to fetch unread count'))
    );
  }

  // ─── WEBSOCKET ────────────────────────────────────────────────────────────

  connect(token: string): Promise<void> {
    if (this.isConnected && this.client?.connected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const wsUrl = `${environment.apiBaseUrl}/ws`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as unknown as IStompSocket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    this.connectionPromise = new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('STOMP client not initialized'));
        return;
      }

      this.client.onConnect = (_frame: Frame) => {
        this.isConnected = true;
        resolve();
      };

      this.client.onStompError = frame => {
        reject(new Error(frame?.headers?.['message'] || 'STOMP error'));
      };

      this.client.onWebSocketClose = () => {
        this.isConnected = false;
        this.connectionPromise = undefined;
      };

      this.client.onWebSocketError = () => {
        this.isConnected = false;
        this.connectionPromise = undefined;
      };

      this.client.activate();
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    if (!this.client) {
      return;
    }
    this.client.deactivate();
    this.isConnected = false;
    this.connectionPromise = undefined;
  }

  onNotification(): Observable<NotificationUI> {
    return new Observable(observer => {
      const subscription = this.subscribe('/user/queue/notifications', message => {
        try {
          observer.next(this.mapToUI(JSON.parse(message.body)));
        } catch (error) {
          observer.error(error);
        }
      });

      return () => subscription?.unsubscribe();
    });
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  private subscribe(destination: string, handler: (message: IMessage) => void): StompSubscription | undefined {
    if (!this.client || !this.isConnected) {
      return undefined;
    }
    return this.client.subscribe(destination, handler);
  }

  private mapPage(response: any): PaginatedNotifications {
    if (!response) {
      return { items: [], totalItems: 0, totalPages: 0, currentPage: 0, pageSize: 0 };
    }

    const items = (response.content ?? []).map((dto: any) => this.mapToUI(dto));

    return {
      items,
      totalItems: response.totalElements ?? items.length,
      totalPages: response.totalPages ?? (items.length ? 1 : 0),
      currentPage: response.number ?? 0,
      pageSize: response.size ?? items.length
    };
  }

  private mapToUI(dto: any): NotificationUI {
    return {
      id: dto?.id ?? 0,
      type: dto?.type ?? '',
      message: dto?.message ?? '',
      link: dto?.link ?? undefined,
      refId: dto?.refId ?? undefined,
      isRead: dto?.isRead ?? false,
      createdAt: dto?.createdAt ? new Date(dto.createdAt) : null
    };
  }

  private handleError(error: any, message: string): Observable<never> {
    const formatted = formatApiError(error, message);
    console.groupCollapsed(`[NotificationFacade] ${formatted}`);
    console.error('Operation:', message);
    console.error('Full Error:', error);
    if (error?.error) console.error('Backend Response:', error.error);
    console.groupEnd();
    return throwError(() => new Error(formatted));
  }
}
