import { Component, computed, inject, signal, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { DatePipe } from '@angular/common';
import { finalize, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { DashboardSidebarComponent } from './dashboard-sidebar';
import { DashboardRightSidebarComponent } from './pomodoro-sidebar';
import { AiAssistant } from './ai-assistant';
import { UserContextService } from '../../services/user-context.service';
import { environment } from '../../../environments/environment';
import { NotificationFacadeService, NotificationUI } from '../../api/facades';

const AUTH_TOKEN_KEY = 'token';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DashboardSidebarComponent,
    DashboardRightSidebarComponent,
    RouterOutlet,
    DatePipe,
    AiAssistant,
  ],
  styles: [`
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
      70%  { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
      100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
    }
    .notif-panel { animation: slideDown 0.22s cubic-bezier(0.16,1,0.3,1) forwards; }
    .notif-badge-pulse { animation: pulse-ring 1.8s ease-out infinite; }
    .notif-row { transition: background 0.15s ease; }
    .notif-row:hover { background: #f8faff; }
    .notif-row.unread { background: #f5f7ff; }
    .notif-row.unread:hover { background: #eef1ff; }
    .notif-text { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
    .notif-text.clamp { -webkit-line-clamp: 2; }
    .notif-scroll::-webkit-scrollbar { width: 4px; }
    .notif-scroll::-webkit-scrollbar-track { background: transparent; }
    .notif-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 9999px; }
    .notif-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `],
  template: `
    <div class="min-h-screen bg-slate-50">
      <div class="w-full px-4 py-6">

        <!-- TOP BAR -->
        <div class="flex items-center justify-end mb-6 pr-1">
          <div class="relative">

            <!-- Bell button -->
            <button
              type="button"
              (click)="toggleNotifications()"
              class="relative flex items-center justify-center w-10 h-10 rounded-2xl
                     bg-white border border-slate-200/80
                     shadow-[0_2px_8px_rgba(15,23,42,0.06)]
                     hover:shadow-[0_4px_16px_rgba(15,23,42,0.1)]
                     hover:border-slate-300 transition-all duration-200"
              [class.bg-indigo-50]="isNotifOpen"
              [class.border-indigo-200]="isNotifOpen"
            >
              <svg class="w-[18px] h-[18px] transition-colors duration-200"
                   [class.text-indigo-600]="isNotifOpen"
                   [class.text-slate-500]="!isNotifOpen"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11
                     a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341
                     C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436
                     L4 17h5m6 0a3 3 0 11-6 0h6z"/>
              </svg>
              @if (unreadCount > 0) {
                <span class="notif-badge-pulse absolute -top-1 -right-1 min-w-[18px] h-[18px]
                             rounded-full bg-rose-500 text-white flex items-center justify-center
                             text-[10px] font-bold leading-none px-1 border-2 border-white">
                  {{ unreadCount > 99 ? '99+' : unreadCount }}
                </span>
              }
            </button>

            <!-- Dropdown panel -->
            @if (isNotifOpen) {
              <div class=" notif-panel absolute right-0 mt-2.5 w-[360px] z-50
                          rounded-2xl overflow-hidden bg-white border border-slate-200/70
                          shadow-[0_20px_60px_-10px_rgba(15,23,42,0.18),0_4px_16px_-4px_rgba(15,23,42,0.08)]">

                <!-- Header -->
                <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100
                            bg-gradient-to-r from-slate-50 to-white">
                  <div class="flex items-center gap-2.5">
                    <span class="flex items-center justify-center w-7 h-7 rounded-xl bg-indigo-100">
                      <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11
                             a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341
                             C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436
                             L4 17h5m6 0a3 3 0 11-6 0h6z"/>
                      </svg>
                    </span>
                    <div>
                      <p class="text-sm font-semibold text-slate-900 leading-none">Notifications</p>
                      @if (unreadCount > 0) {
                        <p class="text-[11px] text-slate-400 mt-0.5 leading-none">{{ unreadCount }} unread</p>
                      } @else {
                        <p class="text-[11px] text-slate-400 mt-0.5 leading-none">All caught up</p>
                      }
                    </div>
                  </div>
                  @if (unreadCount > 0) {
                    <button type="button" (click)="markAllAsRead()"
                      class="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700
                             hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-all duration-150">
                      Mark all read
                    </button>
                  }
                </div>

                <!-- List -->
                <div class="notif-scroll overflow-y-auto max-h-[340px]">

                  <!-- Skeleton: only shown on very first load if silent pre-load hasn't finished yet -->
                  @if (isNotifLoading) {
                    <div class="px-5 py-4 space-y-3">
                      @for (_ of [1,2,3]; track $index) {
                        <div class="flex items-start gap-3 animate-pulse">
                          <div class="w-8 h-8 rounded-xl bg-slate-100 shrink-0"></div>
                          <div class="flex-1 space-y-1.5 pt-0.5">
                            <div class="h-3 bg-slate-100 rounded w-3/4"></div>
                            <div class="h-2.5 bg-slate-100 rounded w-1/2"></div>
                          </div>
                        </div>
                      }
                    </div>
                  }

                  <!-- Empty state -->
                  @if (!isNotifLoading && notifications.length === 0) {
                    <div class="flex flex-col items-center justify-center py-12 px-5 gap-3">
                      <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2
                               H6a2 2 0 01-2-2v-5m16 0H4m8-4v4"/>
                        </svg>
                      </div>
                      <p class="text-sm font-medium text-slate-700">No notifications yet</p>
                      <p class="text-xs text-slate-400">We'll let you know when something arrives</p>
                    </div>
                  }

                  <!-- Notification rows -->
                  @for (notif of notifications; track notif.id) {
                    <button type="button" (click)="openNotification(notif)"
                      class="notif-row w-full text-left px-5 py-3.5
                             border-b border-slate-100/80 last:border-0 flex items-start gap-3"
                      [class.unread]="!notif.isRead">

                      <span class="shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center"
                            [class.bg-rose-100]="!notif.isRead"
                            [class.bg-slate-100]="notif.isRead">
                        <svg class="w-4 h-4"
                             [class.text-rose-500]="!notif.isRead"
                             [class.text-slate-400]="notif.isRead"
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </span>

                      <div class="flex-1 min-w-0">
                        <p class="text-sm leading-snug notif-text"
                           [class.clamp]="!isExpanded(notif.id)"
                           [class.font-semibold]="!notif.isRead"
                           [class.text-slate-900]="!notif.isRead"
                           [class.font-normal]="notif.isRead"
                           [class.text-slate-600]="notif.isRead">
                          {{ notif.message || notif.type }}
                        </p>
                        <button type="button"
                                (click)="toggleExpanded(notif.id, $event)"
                                class="mt-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700">
                          {{ isExpanded(notif.id) ? 'Show less' : 'Show more' }}
                        </button>
                        @if (notif.createdAt) {
                          <p class="text-[11px] text-slate-400 mt-0.5">
                            {{ notif.createdAt | date: 'MMM d · h:mm a' }}
                          </p>
                        }
                      </div>

                      @if (!notif.isRead) {
                        <span class="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      }
                    </button>
                  }

                </div><!-- /list -->

                <!-- Footer -->
                <div class="flex items-center justify-between px-5 py-3
                            border-t border-slate-100 bg-slate-50/70">
                  @if (hasMore) {
                    <button type="button" (click)="loadMoreNotifications()" [disabled]="isLoadingMore"
                      class="flex items-center gap-1.5 text-xs font-medium text-slate-500
                             hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors duration-150">
                      @if (isLoadingMore) {
                        <svg class="w-3.5 h-3.5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10"
                                  stroke="currentColor" stroke-width="4"/>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Loading…
                      } @else {
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round"
                                stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                        Show more
                      }
                    </button>
                  } @else {
                    <span></span>
                  }

                  <button type="button" (click)="isNotifOpen = false"
                    class="flex items-center gap-1.5 text-xs font-medium text-slate-500
                           hover:text-slate-800 transition-colors duration-150">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    Close
                  </button>
                </div>

              </div>
            }<!-- /dropdown -->

          </div>
        </div><!-- /top bar -->

        <!-- MAIN GRID -->
        <div class="grid grid-cols-1 gap-8 items-start"
             [class]="isFocusRoom()
               ? 'lg:grid-cols-[280px_1fr]'
               : 'lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]'">

          <!-- Left sidebar -->
          <div class="sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto
                      [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent
                      [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full
                      hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
            <app-dashboard-sidebar
              [displayName]="displayName()"
              [level]="level()"
              [xp]="xp()"
              [pfp]="pfpUrl()"
              (navigate)="handleSidebarNavigation($event)"
              (logout)="handleLogout()"
            />
          </div>

          <!-- Center -->
          <div class="flex flex-col gap-4 w-full">
            <router-outlet />
          </div>

          <!-- Right sidebar -->
          @if (!isFocusRoom()) {
            <div class="sticky top-6">
              <app-dashboard-right-sidebar />
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Floating AI button -->
    <button (click)="aiOpen.set(true)" aria-label="Open AI Assistant"
      class="fixed bottom-7 right-7 z-50 w-13 h-13 rounded-full border-none
             bg-gradient-to-br from-indigo-500 to-violet-500
             shadow-[0_4px_20px_rgba(99,102,241,0.45)]
             flex items-center justify-center text-white transition-all duration-200
             hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_8px_28px_rgba(99,102,241,0.55)]
             active:scale-95">
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l1.88 5.76a1 1 0 00.95.69H21l-5.12 3.72a1 1 0 00-.36 1.12L17.4 20
                 l-5.12-3.72a1 1 0 00-1.16 0L6 20l1.88-5.71a1 1 0 00-.36-1.12L2 9.45h6.17
                 a1 1 0 00.95-.69L12 3z"/>
      </svg>
    </button>

    @if (aiOpen()) {
      <div class="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
           (click)="aiOpen.set(false)"></div>
    }

    <app-ai-assistant [open]="aiOpen()" (closePanel)="aiOpen.set(false)" />
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly userContext         = inject(UserContextService);
  private readonly router              = inject(Router);
  private readonly notificationFacade  = inject(NotificationFacadeService);
  private readonly cdr                 = inject(ChangeDetectorRef);
  private socketSubscription?: Subscription;

  readonly user    = this.userContext.user;
  readonly aiOpen  = signal(false);

  readonly displayName = computed(() => {
    const u = this.user();
    return `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || u?.username || 'Student';
  });
  readonly pfpUrl  = computed(() => {
    const p = this.user()?.pfp;
    return p ? `${environment.apiBaseUrl}/uploads/${p}` : undefined;
  });
  readonly xp      = computed(() => this.user()?.xpPts ?? 0);
  readonly level   = computed(() => this.user()?.level ?? 1);

  // ── notification state ──────────────────────────────────────────────────
  notifications: NotificationUI[] = [];
  unreadCount    = 0;
  isNotifOpen    = false;
  /** true only during the very first fetch if silent pre-load hasn't finished before first open */
  isNotifLoading = false;
  isLoadingMore  = false;
  hasMore        = false;

  private readonly PAGE_SIZE = 5;
  private currentPage        = 0;
  private preLoaded          = false; // guards against double-fetching
  private hasUnreadCount     = false;
  private expandedNotifs     = new Set<number>();
  // ────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Fetch first page silently — unread count is derived directly from the response
    // so the badge appears as soon as the data lands, with zero extra round-trips.
    this.silentLoad();
    this.refreshUnreadCount();
    this.connectNotifications();
  }

  ngOnDestroy(): void {
    this.socketSubscription?.unsubscribe();
    this.notificationFacade.disconnect();
  }

  isFocusRoom(): boolean {
    return this.router.url.includes('/focus-room');
  }

  handleLogout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    this.userContext.clear();
    this.router.navigateByUrl('/auth/login');
  }

  handleSidebarNavigation(section: string): void {
    const routes: Record<string, string> = {
      dashboard:        '/dashboard/feed',
      feed:             '/dashboard/feed',
      explore:          '/dashboard/explore',
      communities:      '/dashboard/communities',
      'my-created':     '/dashboard/my-created',
      focus:            '/dashboard/focus-room',
      profile:          '/dashboard/profile',
      settings:         '/dashboard/settings',
      support:          '/dashboard/support',
      followed:         '/dashboard/followed',
      bookmarks:        '/dashboard/bookmarks',
      suggestedFriends: '/dashboard/client/suggestedFriends',
      chat:             '/dashboard/chat',
    };
    this.router.navigateByUrl(routes[section] ?? '/dashboard/feed');
  }

  toggleNotifications(): void {
    this.isNotifOpen = !this.isNotifOpen;
    if (this.isNotifOpen) {
      // If the silent pre-load hasn't resolved yet, show skeleton + wait
      if (!this.preLoaded) {
        this.isNotifLoading = true;
      }
      this.refreshUnreadCount();
      // Auto mark all read the moment the panel opens
      if (this.unreadCount > 0) {
        this.markAllAsRead();
      }
    }
  }

  loadMoreNotifications(): void {
    if (this.isLoadingMore || !this.hasMore) return;
    this.isLoadingMore = true;
    const nextPage = this.currentPage + 1;

    this.notificationFacade
      .getMyNotifications({ page: nextPage, size: this.PAGE_SIZE })
      .pipe(take(1), finalize(() => { this.isLoadingMore = false; }))
      .subscribe({
        next: response => {
          const incoming = response.items ?? [];
          const seen = new Set(this.notifications.map(n => n.id));
          this.notifications = [
            ...this.notifications,
            ...incoming.filter((n: NotificationUI) => !seen.has(n.id)),
          ];
          this.currentPage = nextPage;
          this.hasMore = incoming.length >= this.PAGE_SIZE;
        },
        error: err => console.error('[Notifications] load more failed', err),
      });
  }

  markAllAsRead(): void {
    this.notificationFacade.markAllRead().pipe(take(1)).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
        this.unreadCount = 0;
      },
      error: err => console.error('[Notifications] markAllRead failed', err),
    });
  }

  openNotification(notif: NotificationUI): void {
    if (!notif.isRead) this.markAsRead(notif);
    if (notif.link) this.router.navigateByUrl(notif.link).catch(() => undefined);
  }

  isExpanded(id: number): boolean {
    return this.expandedNotifs.has(id);
  }

  toggleExpanded(id: number, event: Event): void {
    event.stopPropagation();
    if (this.expandedNotifs.has(id)) {
      this.expandedNotifs.delete(id);
    } else {
      this.expandedNotifs.add(id);
    }
  }

  // ── private ─────────────────────────────────────────────────────────────

  /**
   * Fetches the first page in the background without touching isNotifLoading.
   * Called once from ngOnInit so notifications are ready before first open.
   */
  private silentLoad(): void {
    this.currentPage = 0;
    this.notificationFacade
      .getMyNotifications({ page: 0, size: this.PAGE_SIZE })
      .pipe(take(1))
      .subscribe({
        next: response => {
          this.notifications  = response.items ?? [];
          this.hasMore        = this.notifications.length >= this.PAGE_SIZE;
          this.preLoaded      = true;
          this.isNotifLoading = false; // in case panel opened before this resolved
          // Only derive unread count from items if we haven't fetched the server count yet
          if (!this.hasUnreadCount) {
            this.unreadCount = this.notifications.filter(n => !n.isRead).length;
          }
        },
        error: err => {
          console.error('[Notifications] silent pre-load failed', err);
          this.isNotifLoading = false;
          this.preLoaded      = true;
        },
      });
  }

  private refreshUnreadCount(): void {
    this.notificationFacade.countUnread().pipe(take(1)).subscribe({
      next: count => {
        this.unreadCount = Number(count ?? 0);
        this.hasUnreadCount = true;
        this.cdr.markForCheck();
      },
      error: err => console.error('[Notifications] count failed', err),
    });
  }

  private connectNotifications(): void {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)?.trim();
    if (!token) return;

    this.notificationFacade.connect(token).then(() => {
      this.socketSubscription?.unsubscribe();
      this.socketSubscription = this.notificationFacade.onNotification().subscribe({
        next: notif => {
          const idx = this.notifications.findIndex(n => n.id === notif.id);
          if (idx >= 0) {
            this.notifications = this.notifications.map(n => n.id === notif.id ? notif : n);
          } else {
            const cap = (this.currentPage + 1) * this.PAGE_SIZE;
            this.notifications = [notif, ...this.notifications].slice(0, cap);
          }
          if (!notif.isRead) this.unreadCount += 1;
        },
        error: err => console.error('[Notifications] socket error', err),
      });
    }).catch(err => console.error('[Notifications] connect failed', err));
  }

  private markAsRead(notif: NotificationUI): void {
    this.notificationFacade.markRead(notif.id).pipe(take(1)).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n =>
          n.id === notif.id ? { ...n, isRead: true } : n
        );
        if (this.unreadCount > 0) this.unreadCount -= 1;
      },
      error: err => console.error('[Notifications] markRead failed', err),
    });
  }
}
