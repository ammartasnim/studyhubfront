import { Component, computed, inject, signal, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { finalize, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { DashboardSidebarComponent } from './dashboard-sidebar';
import { DashboardRightSidebarComponent } from './pomodoro-sidebar';
import { AiAssistant } from './ai-assistant';
import { UserContextService } from '../../services/user-context.service';
import { environment } from '../../../environments/environment';
import { NotificationFacadeService, NotificationUI, PostFacadeService } from '../../api/facades';
import { PostUI } from '../../api/facades/models/post.model';
import { PostCardComponent } from '../client/modals/posts';

const AUTH_TOKEN_KEY = 'token';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DashboardSidebarComponent,
    DashboardRightSidebarComponent,
    RouterOutlet,
    DatePipe,
    CommonModule,
    AiAssistant,
    PostCardComponent,
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
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
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
    .post-modal { animation: modalIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards; }
  `],
  template: `
    <div class="min-h-screen bg-slate-50">
      <div class="w-full px-4 py-6">
        <div class="grid grid-cols-1 gap-8 items-start"
             [class]="isFocusRoom()
               ? 'lg:grid-cols-[280px_1fr]'
               : 'lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]'">

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

          <div class="flex flex-col gap-4 w-full">
            <router-outlet />
          </div>

          @if (!isFocusRoom()) {
            <div class="sticky top-6">
              <div class="relative">
                <div class="absolute right-4 top-3 z-30">
                  <div class="relative">

                    <button type="button" (click)="toggleNotifications()"
                      class="relative flex items-center justify-center w-12 h-12 rounded-2xl
                             bg-white border border-slate-200/80
                             shadow-[0_4px_14px_rgba(15,23,42,0.12)]
                             hover:shadow-[0_6px_20px_rgba(15,23,42,0.18)]
                             hover:border-slate-300 transition-all duration-200"
                      [class.bg-indigo-50]="isNotifOpen"
                      [class.border-indigo-200]="isNotifOpen">
                      <svg class="w-5 h-5 transition-colors duration-200"
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

                    @if (isNotifOpen) {
                      <div class="notif-panel absolute right-0 mt-2.5 w-[360px] z-50
                                  rounded-2xl overflow-hidden bg-white border border-slate-200/70
                                  shadow-[0_20px_60px_-10px_rgba(15,23,42,0.18),0_4px_16px_-4px_rgba(15,23,42,0.08)]">

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

                        <div class="notif-scroll overflow-y-auto max-h-[340px]">
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
                        </div>

                        <!-- Footer: true pagination (prev / page-N / next) -->
                        <div class="flex items-center justify-between px-5 py-3
                                    border-t border-slate-100 bg-slate-50/70">
                          <div class="flex items-center gap-1">
                            @if (currentPage > 0) {
                              <button type="button" (click)="loadPage(currentPage - 1)" [disabled]="isLoadingMore"
                                class="flex items-center gap-1 text-xs font-medium text-slate-500
                                       hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                                </svg>
                                Prev
                              </button>
                            }
                            @if (totalPages > 1) {
                              <span class="text-[11px] text-slate-400 px-1">{{ currentPage + 1 }}&nbsp;/&nbsp;{{ totalPages }}</span>
                            }
                            @if (hasMore) {
                              <button type="button" (click)="loadPage(currentPage + 1)" [disabled]="isLoadingMore"
                                class="flex items-center gap-1 text-xs font-medium text-slate-500
                                       hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50">
                                @if (isLoadingMore) {
                                  <svg class="w-3.5 h-3.5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                  </svg>
                                  Loading…
                                } @else {
                                  Next
                                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                  </svg>
                                }
                              </button>
                            }
                          </div>
                          <button type="button" (click)="isNotifOpen = false"
                            class="flex items-center gap-1.5 text-xs font-medium text-slate-500
                                   hover:text-slate-800 transition-colors duration-150">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            Close
                          </button>
                        </div>

                      </div>
                    }

                  </div>
                </div>
                <app-dashboard-right-sidebar />
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- AI floating button -->
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

    <!-- ─── POST / COMMENT POPUP MODAL ──────────────────────────────────── -->
    @if (modalOpen()) {
      <div class="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
           (click)="closePostModal()"></div>

      <div class="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <div class="post-modal pointer-events-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto
                    bg-white rounded-2xl shadow-[0_32px_80px_-12px_rgba(15,23,42,0.35)]
                    border border-slate-200/70">

          <!-- Modal header bar -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100
                      bg-gradient-to-r from-slate-50 to-white sticky top-0 z-10">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                       a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </span>
              <p class="text-sm font-semibold text-slate-900">
                {{ modalTargetCommentId() ? 'Post & Comment' : 'Post' }}
              </p>
            </div>
            <button type="button" (click)="closePostModal()"
              class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400
                     hover:text-slate-700 hover:bg-slate-100 transition-all duration-150">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Loading skeleton -->
          @if (modalLoading()) {
            <div class="p-6 space-y-4 animate-pulse">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-slate-100"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3 bg-slate-100 rounded w-1/4"></div>
                  <div class="h-2.5 bg-slate-100 rounded w-1/6"></div>
                </div>
              </div>
              <div class="h-4 bg-slate-100 rounded w-3/4"></div>
              <div class="h-3 bg-slate-100 rounded w-full"></div>
              <div class="h-3 bg-slate-100 rounded w-5/6"></div>
            </div>
          }

          <!-- Error -->
          @if (modalError()) {
            <div class="p-8 text-center">
              <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3">
                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p class="text-sm text-slate-700 font-medium">{{ modalError() }}</p>
              <button type="button" (click)="closePostModal()"
                class="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium">Close</button>
            </div>
          }

          <!-- Post card (rendered when loaded) -->
          @if (!modalLoading() && !modalError() && modalPost()) {
            <app-post-card
              [post]="modalPost()!"
              [showLike]="true"
              [showComments]="true"
              [showReport]="true"
              [showCommunity]="true"
              [showOwnerDelete]="false"
              [showEdit]="false"
            />

            <!-- Comment-target hint banner -->
            @if (modalTargetCommentId()) {
              <div class="px-6 py-3 bg-indigo-50 border-t border-indigo-100 flex items-center gap-2.5">
                <svg class="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8
                       a2 2 0 01-2 2h-3l-4 4z"/>
                </svg>
                <p class="text-xs text-indigo-700 font-medium">
                  Expand the comments section — the mentioned comment will be highlighted.
                </p>
              </div>
            }
          }

        </div>
      </div>
    }
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly userContext        = inject(UserContextService);
  private readonly router             = inject(Router);
  private readonly notificationFacade = inject(NotificationFacadeService);
  private readonly postFacade         = inject(PostFacadeService);
  private readonly cdr                = inject(ChangeDetectorRef);
  private socketSubscription?: Subscription;

  readonly user   = this.userContext.user;
  readonly aiOpen = signal(false);

  notifications: NotificationUI[] = [];
  unreadCount    = 0;
  isNotifOpen    = false;
  isNotifLoading = false;
  isLoadingMore  = false;
  hasMore        = false;

  // Pagination — true page-by-page, list is replaced not appended
  private readonly PAGE_SIZE = 5;
  currentPage                = 0;
  totalPages                 = 0;
  private totalItems         = 0;
  private preLoaded          = false;
  private hasUnreadCount     = false;
  private expandedNotifs     = new Set<number>();

  // Post / comment popup modal
  readonly modalOpen            = signal(false);
  readonly modalPost            = signal<PostUI | null>(null);
  readonly modalTargetCommentId = signal<number | null>(null);
  readonly modalLoading         = signal(false);
  readonly modalError           = signal<string | null>(null);

  readonly displayName = computed(() => {
    const u = this.user();
    return `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || u?.username || 'Student';
  });
  readonly pfpUrl = computed(() => {
    const p = this.user()?.pfp;
    return p ? `${environment.apiBaseUrl}/uploads/${p}` : undefined;
  });
  readonly xp    = computed(() => this.user()?.xpPts ?? 0);
  readonly level = computed(() => this.user()?.level ?? 1);

  ngOnInit(): void {
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
      if (!this.preLoaded) this.isNotifLoading = true;
      this.refreshUnreadCount();
    }
  }

  /** True pagination — replaces the current list with the requested page */
  loadPage(page: number): void {
    if (this.isLoadingMore) return;
    if (page < 0) return;
    if (this.totalPages > 0 && page >= this.totalPages) return;
    this.isLoadingMore = true;

    this.notificationFacade
      .getMyNotifications({ page, size: this.PAGE_SIZE })
      .pipe(take(1), finalize(() => { this.isLoadingMore = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: res => {
          this.notifications = res.items ?? [];
          this.currentPage   = page;
          this.totalItems    = res.totalItems ?? 0;
          this.totalPages    = res.totalPages ?? Math.ceil(this.totalItems / this.PAGE_SIZE);
          this.hasMore       = this.currentPage + 1 < this.totalPages;
        },
        error: err => console.error('[Notifications] loadPage failed', err),
      });
  }

  markAllAsRead(): void {
    this.notificationFacade.markAllRead().pipe(take(1)).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
        this.unreadCount   = 0;
      },
      error: err => console.error('[Notifications] markAllRead failed', err),
    });
  }

  /** Notification click handler */
  openNotification(notif: NotificationUI): void {
    if (!notif.isRead) this.markAsRead(notif);
    this.isNotifOpen = false;

    const type       = (notif.type       ?? '').toUpperCase();
    const targetType = (notif.targetType ?? '').toUpperCase();

    // Friend / moderation — navigate as before
    if (type === 'FRIEND') { this.router.navigateByUrl('/dashboard/client/suggestedFriends'); return; }
    if (type === 'WARN' || type === 'BAN') { this.router.navigateByUrl('/dashboard/client/communities'); return; }

    // Post / comment / like / mention — open inline popup
    if (notif.refId && (type === 'COMMENT' || type === 'LIKE' || type === 'MENTION' || notif.refId)) {
      const isCommentTarget = targetType === 'COMMENT';

      if (isCommentTarget && notif.refId) {
        // refId is a comment ID → fetch the parent post from the backend
        this.openPostModalForComment(notif.refId);
      } else if (notif.refId) {
        // refId is directly the post ID
        this.openPostModal(notif.refId, null);
      }
      return;
    }

    // Fallback to link navigation
    if (notif.link) {
      this.router.navigateByUrl(notif.link).catch(() => undefined);
    }
  }

  closePostModal(): void {
    this.modalOpen.set(false);
    this.modalPost.set(null);
    this.modalTargetCommentId.set(null);
    this.modalError.set(null);
  }

  isExpanded(id: number): boolean { return this.expandedNotifs.has(id); }

  toggleExpanded(id: number, event: Event): void {
    event.stopPropagation();
    this.expandedNotifs.has(id) ? this.expandedNotifs.delete(id) : this.expandedNotifs.add(id);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private openPostModal(postId: number, commentId: number | null): void {
    this.modalOpen.set(true);
    this.modalLoading.set(true);
    this.modalError.set(null);
    this.modalPost.set(null);
    this.modalTargetCommentId.set(commentId);

    this.postFacade.getById(postId).pipe(take(1)).subscribe({
      next:  post => { this.modalPost.set(post); this.modalLoading.set(false); },
      error: err  => {
        this.modalLoading.set(false);
        this.modalError.set('Could not load this post. It may have been deleted.');
        console.error('[NotifModal] failed to load post', err);
      },
    });
  }

  private openPostModalForComment(commentId: number): void {

    this.modalOpen.set(true);
    this.modalLoading.set(true);
    this.modalError.set(null);
    this.modalPost.set(null);
    this.modalTargetCommentId.set(commentId);

    const source$ = (this.postFacade as any).getPostByCommentId
      ? (this.postFacade as any).getPostByCommentId(commentId)
      : this.postFacade.getById(commentId);

    source$.pipe(take(1)).subscribe({
      next:  (post: PostUI) => { this.modalPost.set(post); this.modalLoading.set(false); },
      error: (err: any) => {
        this.modalLoading.set(false);
        this.modalError.set('Could not load the post for this comment.');
        console.error('[NotifModal] failed to load comment post', err);
      },
    });
  }

  private silentLoad(): void {
    this.currentPage = 0;
    this.notificationFacade
      .getMyNotifications({ page: 0, size: this.PAGE_SIZE })
      .pipe(take(1))
      .subscribe({
        next: res => {
          this.notifications  = res.items ?? [];
          this.totalItems     = res.totalItems ?? this.notifications.length;
          this.totalPages     = res.totalPages ?? Math.ceil(this.totalItems / this.PAGE_SIZE);
          this.hasMore        = this.currentPage + 1 < this.totalPages;
          this.preLoaded      = true;
          this.isNotifLoading = false;
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
      next:  count => { this.unreadCount = Number(count ?? 0); this.hasUnreadCount = true; this.cdr.markForCheck(); },
      error: err   => console.error('[Notifications] count failed', err),
    });
  }

  private connectNotifications(): void {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)?.trim();
    if (!token) return;

    this.notificationFacade.connect(token).then(() => {
      this.socketSubscription?.unsubscribe();
      this.socketSubscription = this.notificationFacade.onNotification().subscribe({
        next: notif => {
          if (this.currentPage === 0) {
            const idx = this.notifications.findIndex(n => n.id === notif.id);
            if (idx >= 0) {
              this.notifications = this.notifications.map(n => n.id === notif.id ? notif : n);
            } else {
              this.notifications = [notif, ...this.notifications].slice(0, this.PAGE_SIZE);
            }
          }
          if (!notif.isRead) this.unreadCount += 1;
          this.cdr.markForCheck();
        },
        error: err => console.error('[Notifications] socket error', err),
      });
    }).catch(err => console.error('[Notifications] connect failed', err));
  }

  private markAsRead(notif: NotificationUI): void {
    this.notificationFacade.markRead(notif.id).pipe(take(1)).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => n.id === notif.id ? { ...n, isRead: true } : n);
        if (this.unreadCount > 0) this.unreadCount -= 1;
      },
      error: err => console.error('[Notifications] markRead failed', err),
    });
  }
}