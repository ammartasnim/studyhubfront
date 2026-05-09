import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { ChatFacadeService } from '../../../api/facades/chat.facade';
import { FriendshipFacadeService } from '../../../api/facades/friendship.facade';
import { ConversationUI, MessageUI, PaginatedMessages, UserSummaryUI } from '../../../api/facades';
import { UserContextService } from '../../../services/user-context.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full min-h-0'
  },
  template: `
  <div style="display: grid; grid-template-columns: 320px 1fr; gap: 24px; height: 85vh;">

    <!-- Friends list -->
    <section style="border-radius: 16px; border: 1px solid #e2e8f0; background: white; overflow: hidden; display: flex; flex-direction: column;">
      <div class="px-5 py-4 border-b border-slate-100">
        <h2 class="text-base font-bold text-slate-900">Chats</h2>
        <p class="text-xs text-slate-500">Message your friends</p>
        <div class="mt-3 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search friends"
            [value]="friendQuery()"
            (input)="friendQuery.set($any($event.target).value)"
            class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div style="overflow-y: auto; flex: 1 1 0%; min-height: 0;">
        @if (friendsLoading()) {
          <div class="p-6 flex items-center justify-center">
            <div class="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        } @else if (friendsError()) {
          <div class="p-6 text-sm text-rose-600">{{ friendsError() }}</div>
        } @else if (filteredFriends().length === 0) {
          <div class="p-6 text-sm text-slate-500">No friends found.</div>
        } @else {
          <div class="divide-y divide-slate-100">
            @for (friend of filteredFriends(); track friend.id) {
              <button
                type="button"
                (click)="selectFriend(friend)"
                class="w-full px-5 py-3 flex items-center gap-3 text-left transition-colors"
                [class.bg-indigo-50]="friend.id === selectedFriendId()"
              >
                <div class="w-11 h-11 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                  @if (friend.pfp) {
                    <img [src]="avatarUrl(friend.pfp)" [alt]="friend.fullName || friend.username || 'User'" class="w-full h-full object-cover" />
                  } @else {
                    <span class="text-slate-600 font-semibold text-sm">{{ friendInitials(friend) }}</span>
                  }
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-slate-900 truncate">{{ friend.fullName || friend.username || 'User' }}</p>
                  <p class="text-xs text-slate-500 truncate">{{ lastMessagePreview(friend.id) }}</p>
                </div>
              </button>
            }
          </div>
        }
      </div>
    </section>

    <!-- Chat panel -->
    <section style="border-radius: 16px; border: 1px solid #e2e8f0; background: white; display: flex; flex-direction: column; overflow: hidden;">

      <!-- Header - fixed height -->
      <div style="flex-shrink: 0;" class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">
            @if (selectedFriend()) { {{ selectedFriend()!.fullName || selectedFriend()!.username || 'Chat' }} } @else { Chat }
          </h2>
          <p class="text-xs text-slate-500">
            @if (!isConnected()) { Connecting... } @else { Online }
          </p>
        </div>
        @if (selectedFriend()) {
          <span class="text-xs text-slate-400">&#64;{{ selectedFriend()!.username || 'user' }}</span>
        }
      </div>

      @if (!selectedFriend()) {
        <div style="flex: 1;" class="flex items-center justify-center text-slate-500 text-sm">
          Select a friend to start chatting.
        </div>
      } @else {

        <!-- Messages - this is the scrollable area -->
        <div
          #messageScroll
          (scroll)="onMessagesScroll($event)"
          style="flex: 1 1 0%; min-height: 0; overflow-y: auto; padding: 24px; background: #f8fafc; display: flex; flex-direction: column; gap: 12px;"
        >
          @if (isHistoryLoading()) {
            <div style="display: flex; justify-content: center; padding: 8px 0;">
              <div class="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          }
         <div style="flex: 1;">
          @for (message of selectedMessages(); track message.id) {
            <div style="display: flex;" [style.justify-content]="isOwnMessage(message) ? 'flex-end' : 'flex-start'">
              <div
                style="max-width: 70%; border-radius: 16px; padding: 8px 12px; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"
                [style.background]="isOwnMessage(message) ? '#4f46e5' : 'white'"
                [style.color]="isOwnMessage(message) ? 'white' : '#334155'"
              >
                <p style="white-space: pre-line;">{{ message.content }}</p>
                <p style="margin-top: 4px; font-size: 10px; opacity: 0.7; text-align: right;">{{ formatTime(message.createdAt) }}</p>
              </div>
            </div>
          }
          </div>
        </div>

        <!-- Input bar - fixed height -->
        <div style="flex-shrink: 0; padding: 16px 24px; border-top: 1px solid #f1f5f9; background: white;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <input
              type="text"
              placeholder="Type your message..."
              [value]="messageInput()"
              (input)="messageInput.set($any($event.target).value)"
              (keyup.enter)="sendMessage()"
              class="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              (click)="sendMessage()"
              [disabled]="!messageInput().trim()"
              class="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      }
    </section>
  </div>
`
})
export class ChatComponent implements OnInit, OnDestroy {
  private readonly chatFacade = inject(ChatFacadeService);
  private readonly friendshipFacade = inject(FriendshipFacadeService);
  private readonly userContext = inject(UserContextService);

  @ViewChild('messageScroll') private readonly messageScroll?: ElementRef<HTMLDivElement>;

  readonly friends = signal<UserSummaryUI[]>([]);
  readonly friendsLoading = signal(true);
  readonly friendsError = signal<string | null>(null);
  readonly friendQuery = signal('');

  readonly selectedFriendId = signal<number | null>(null);
  readonly messagesByFriend = signal<Map<number, MessageUI[]>>(new Map());
  readonly conversationsByFriend = signal<Map<number, ConversationUI>>(new Map());
  readonly messageInput = signal('');

  readonly isConnected = signal(false);
  readonly connectError = signal<string | null>(null);

  private readonly subscriptions: Subscription[] = [];

  private readonly historyPagingByFriend = signal(
    new Map<number, { currentPage: number; totalPages: number; loading: boolean }>()
  );
  private readonly historyRequestByConversation = new Map<
    number,
    { friendId: number; page: number; pageSize: number }
  >();
  private readonly pendingScrollAdjustByFriend = new Map<number, { height: number; top: number }>();
  private lastHistoryConversationId: number | null = null;

  readonly currentUserId = computed(() => this.userContext.user()?.id ?? null);

  readonly selectedFriend = computed(() =>
    this.friends().find(friend => friend.id === this.selectedFriendId()) ?? null
  );

  readonly filteredFriends = computed(() => {
    const query = this.friendQuery().trim().toLowerCase();
    if (!query) return this.friends();
    return this.friends().filter(friend => {
      const name = `${friend.fullName ?? ''} ${friend.username ?? ''}`.toLowerCase();
      return name.includes(query);
    });
  });

  readonly selectedMessages = computed(() => {
    const id = this.selectedFriendId();
    if (!id) return [];
    return this.messagesByFriend().get(id) ?? [];
  });

  readonly isHistoryLoading = computed(() => {
    const friendId = this.selectedFriendId();
    if (!friendId) return false;
    return this.historyPagingByFriend().get(friendId)?.loading ?? false;
  });

  ngOnInit(): void {
    this.loadFriends();
    this.connectSocket();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatFacade.disconnect();
  }

  private async connectSocket(): Promise<void> {
    const token = localStorage.getItem('token')?.trim();
    if (!token) {
      this.connectError.set('Missing auth token. Please log in again.');
      return;
    }

    try {
      await this.chatFacade.connect(token);
      this.isConnected.set(true);
      this.connectError.set(null);
      this.setupSubscriptions();
      this.chatFacade.requestConversations();
    } catch (error: any) {
      this.isConnected.set(false);
      this.connectError.set(error?.message ?? 'Failed to connect to chat.');
    }
  }

  private setupSubscriptions(): void {
    this.subscriptions.push(
      this.chatFacade.onMessageReceived().subscribe({
        next: message => this.pushMessage(message),
        error: err => console.error('[Chat] message stream error', err)
      })
    );

    this.subscriptions.push(
      this.chatFacade.onConversations().subscribe({
        next: conversations => this.storeConversations(conversations),
        error: err => console.error('[Chat] conversations stream error', err)
      })
    );

    this.subscriptions.push(
      this.chatFacade.onHistory().subscribe({
        next: payload => this.storeHistory(payload),
        error: err => console.error('[Chat] history stream error', err)
      })
    );
  }

  private loadFriends(): void {
    this.friendsLoading.set(true);
    this.friendshipFacade.getFriends({ page: 0, size: 50 }).subscribe({
      next: response => {
        this.friends.set(response.items ?? []);
        this.friendsLoading.set(false);
      },
      error: err => {
        this.friendsError.set(err?.message ?? 'Failed to load friends.');
        this.friendsLoading.set(false);
      }
    });
  }

  selectFriend(friend: UserSummaryUI): void {
    this.selectedFriendId.set(friend.id);
    this.messageInput.set('');

    this.historyPagingByFriend.update(map => {
      const next = new Map(map);
      next.set(friend.id, { currentPage: 0, totalPages: 0, loading: false });
      return next;
    });

    const conversation = this.conversationsByFriend().get(friend.id);
    if (conversation) {
      this.requestHistoryForFriend(friend.id, conversation.id, 0);
    }
  }

  sendMessage(): void {
    const friend = this.selectedFriend();
    if (!friend) return;

    const content = this.messageInput().trim();
    if (!content) return;

    this.chatFacade.sendMessage({
      recipientId: friend.id,
      content
    });

    const tempMessage: MessageUI = {
      id: Date.now(),
      conversationId: 0,
      senderId: this.currentUserId() ?? 0,
      senderUsername: this.userContext.user()?.username ?? undefined,
      recipientId: friend.id,
      recipientUsername: friend.username ?? undefined,
      content,
      status: 'SENT',
      createdAt: new Date()
    };
    this.pushMessage(tempMessage);
    this.messageInput.set('');
  }

  private storeConversations(conversations: ConversationUI[]): void {
    const currentUserId = this.currentUserId();
    if (!currentUserId) return;

    const map = new Map(this.conversationsByFriend());
    conversations.forEach(conversation => {
      const friendId = conversation.userOneId === currentUserId
        ? conversation.userTwoId
        : conversation.userOneId;
      map.set(friendId, conversation);

      if (conversation.lastMessage) {
        this.pushMessage(conversation.lastMessage);
      }
    });

    this.conversationsByFriend.set(map);
  }

private storeHistory(payload: PaginatedMessages): void {
  const items = payload.items ?? [];
  items.forEach(message => this.pushMessage(message));

  // Use selectedFriendId directly — no fragile map lookup
  const friendId = this.selectedFriendId();
  if (!friendId) return;

  const totalPages = payload.totalPages ?? 1;
  const currentPage = payload.currentPage ?? 0;

  this.historyPagingByFriend.update(map => {
    const next = new Map(map);
    next.set(friendId, {
      currentPage,
      totalPages,
      loading: false // ✅ always unlocks scrolling
    });
    return next;
  });

  // Restore scroll position after older messages prepended
  const pending = this.pendingScrollAdjustByFriend.get(friendId);
  if (pending) {
    this.pendingScrollAdjustByFriend.delete(friendId);
    setTimeout(() => {
      const container = this.messageScroll?.nativeElement;
      if (!container) return;
      const delta = container.scrollHeight - pending.height;
      container.scrollTop = pending.top + delta;
    }, 50); // slight delay to let DOM update
  }

  // Scroll to bottom only on first page load
  if (currentPage === 0) {
    setTimeout(() => {
      const container = this.messageScroll?.nativeElement;
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    }, 50);
  }
}

 onMessagesScroll(event: Event): void {
  const container = event.target as HTMLDivElement | null;
  if (!container) return;

  const friendId = this.selectedFriendId();
  if (!friendId) return;

  if (container.scrollTop > 80) return; // only near the top

  const paging = this.historyPagingByFriend().get(friendId);
  if (!paging) return;

  if (paging.loading) return; // already loading
  
  // ✅ only block if we KNOW there are no more pages (totalPages > 0)
  if (paging.totalPages > 0 && paging.currentPage + 1 >= paging.totalPages) return;

  const conversation = this.conversationsByFriend().get(friendId);
  if (!conversation) return;

  this.pendingScrollAdjustByFriend.set(friendId, {
    height: container.scrollHeight,
    top: container.scrollTop
  });

  this.requestHistoryForFriend(friendId, conversation.id, paging.currentPage + 1);
}

  private requestHistoryForFriend(friendId: number, conversationId: number, page: number): void {
    const pageSize = 20;
    this.historyPagingByFriend.update(map => {
      const next = new Map(map);
      const existing = next.get(friendId);
      next.set(friendId, {
        currentPage: existing?.currentPage ?? 0,
        totalPages: existing?.totalPages ?? 0,
        loading: true
      });
      return next;
    });

    this.historyRequestByConversation.set(conversationId, { friendId, page, pageSize });
    this.lastHistoryConversationId = conversationId;
    this.chatFacade.requestHistory({
      conversationId,
      page,
      size: pageSize
    });
  }

private pushMessage(message: MessageUI): void {
  const friendId = this.getFriendIdFromMessage(message);
  if (!friendId) return;

  this.messagesByFriend.update(map => {
    const next = new Map(map);
    const existing = next.get(friendId) ?? [];

    // Deduplicate: skip if exact ID already exists
    // Also replace temp message (Date.now() id) if content+recipient match
    const isDuplicate = existing.some(m =>
      m.id === message.id ||
      (m.content === message.content &&
       m.recipientId === message.recipientId &&
       m.senderId === message.senderId &&
       Math.abs(this.messageSortValue(m) - this.messageSortValue(message)) < 5000)
    );

    if (isDuplicate) return map; // no change

    const merged = [...existing, message]
      .filter(m => m.content)
      .sort((a, b) => this.messageSortValue(a) - this.messageSortValue(b));

    next.set(friendId, merged);
    return next;
  });
}
  private getFriendIdFromMessage(message: MessageUI): number | null {
    const currentUserId = this.currentUserId();
    if (!currentUserId) return null;
    return message.senderId === currentUserId ? message.recipientId : message.senderId;
  }

  private messageSortValue(message: MessageUI): number {
    const time = message.createdAt ? new Date(message.createdAt).getTime() : 0;
    return time || message.id;
  }

  isOwnMessage(message: MessageUI): boolean {
    return message.senderId === this.currentUserId();
  }

  formatTime(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  avatarUrl(pfp?: string | null): string {
    if (!pfp) return '';
    if (pfp.startsWith('http://') || pfp.startsWith('https://')) return pfp;
    if (pfp.startsWith('/uploads/')) return `${environment.apiBaseUrl}${pfp}`;
    return `${environment.apiBaseUrl}/uploads/${pfp}`;
  }

  friendInitials(friend: UserSummaryUI): string {
    const name = friend.fullName?.trim() || friend.username?.trim() || 'User';
    const parts = name.split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  lastMessagePreview(friendId: number): string {
    const messages = this.messagesByFriend().get(friendId) ?? [];
    const last = messages[messages.length - 1];
    return last?.content ?? 'Start a conversation';
  }
}
