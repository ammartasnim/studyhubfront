import { Injectable } from '@angular/core';
import { Client, Frame, IMessage, IStompSocket, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ConversationUI,
  MessageHistoryRequest,
  MessageReadRequest,
  MessageSendRequest,
  MessageUI,
  PaginatedMessages
} from './models/message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatFacadeService {
  private client?: Client;
  private connectionPromise?: Promise<void>;
  private isConnected = false;

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

  sendMessage(request: MessageSendRequest): void {
    this.assertConnected();
    this.client?.publish({
      destination: '/app/messages.send',
      body: JSON.stringify({
        recipientId: request.recipientId,
        content: request.content
      })
    });
  }

  markConversationRead(request: MessageReadRequest): void {
    this.assertConnected();
    this.client?.publish({
      destination: '/app/messages.read',
      body: JSON.stringify({
        conversationId: request.conversationId
      })
    });
  }

  requestConversations(): void {
    this.assertConnected();
    this.client?.publish({
      destination: '/app/messages.conversations',
      body: '{}'
    });
  }

  requestHistory(request: MessageHistoryRequest): void {
    this.assertConnected();
    this.client?.publish({
      destination: '/app/messages.history',
      body: JSON.stringify({
        conversationId: request.conversationId,
        page: request.page,
        size: request.size
      })
    });
  }

  onMessageReceived(): Observable<MessageUI> {
    return new Observable(observer => {
      const subscription = this.subscribe('/user/queue/messages', message => {
        try {
          observer.next(this.mapMessage(JSON.parse(message.body)));
        } catch (error) {
          observer.error(error);
        }
      });

      return () => subscription?.unsubscribe();
    });
  }

  onConversations(): Observable<ConversationUI[]> {
    return new Observable(observer => {
      const subscription = this.subscribe('/user/queue/conversations', message => {
        try {
          const payload = JSON.parse(message.body);
          const conversations = Array.isArray(payload)
            ? payload.map(dto => this.mapConversation(dto))
            : [];
          observer.next(conversations);
        } catch (error) {
          observer.error(error);
        }
      });

      return () => subscription?.unsubscribe();
    });
  }

  onHistory(): Observable<PaginatedMessages> {
    return new Observable(observer => {
      const subscription = this.subscribe('/user/queue/messages.history', message => {
        try {
          const payload = JSON.parse(message.body);
          observer.next(this.mapMessagePage(payload));
        } catch (error) {
          observer.error(error);
        }
      });

      return () => subscription?.unsubscribe();
    });
  }

  private subscribe(destination: string, handler: (message: IMessage) => void): StompSubscription | undefined {
    if (!this.client || !this.isConnected) {
      return undefined;
    }
    return this.client.subscribe(destination, handler);
  }

  private assertConnected(): void {
    if (!this.client || !this.isConnected) {
      throw new Error('Chat socket not connected');
    }
  }

  private mapMessage(dto: any): MessageUI {
    return {
      id: dto?.id ?? 0,
      conversationId: dto?.conversationId ?? 0,
      senderId: dto?.senderId ?? 0,
      senderUsername: dto?.senderUsername ?? undefined,
      recipientId: dto?.recipientId ?? 0,
      recipientUsername: dto?.recipientUsername ?? undefined,
      content: dto?.content ?? '',
      status: dto?.status ?? undefined,
      createdAt: dto?.createdAt ? new Date(dto.createdAt) : null
    };
  }

  private mapConversation(dto: any): ConversationUI {
    return {
      id: dto?.id ?? 0,
      userOneId: dto?.userOneId ?? 0,
      userTwoId: dto?.userTwoId ?? 0,
      updatedAt: dto?.updatedAt ? new Date(dto.updatedAt) : null,
      lastMessage: dto?.lastMessage ? this.mapMessage(dto.lastMessage) : undefined
    };
  }

  private mapMessagePage(payload: any): PaginatedMessages {
    const items = (payload?.content ?? []).map((dto: any) => this.mapMessage(dto));
    return {
      items,
      totalItems: payload?.totalElements ?? items.length,
      totalPages: payload?.totalPages ?? (items.length ? 1 : 0),
      currentPage: payload?.number ?? 0,
      pageSize: payload?.size ?? items.length
    };
  }
}
