


import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { FriendshipFacadeService } from '../../api/facades/friendship.facade';
import { FriendshipUI, UserSummaryUI } from '../../api/facades/models/friendship.model';
import { PaginationComponent, PaginationConfig } from '../../shared/pagination/pagination.component';



@Component({
  selector: 'app-suggested-friends',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent],
  template: `
    <div class="flex flex-col gap-6 pb-10">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-slate-900">Explore Friends</h2>
        <span class="text-sm text-slate-500">Add friends or review requests</span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
          [class.bg-indigo-600]="activeTab() === 'suggested'"
          [class.text-white]="activeTab() === 'suggested'"
          [class.border-indigo-600]="activeTab() === 'suggested'"
          [class.bg-white]="activeTab() !== 'suggested'"
          [class.text-slate-700]="activeTab() !== 'suggested'"
          [class.border-slate-200]="activeTab() !== 'suggested'"
          (click)="activeTab.set('suggested')"
        >
          Suggested Friends
        </button>
        <button
          class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
          [class.bg-indigo-600]="activeTab() === 'pending'"
          [class.text-white]="activeTab() === 'pending'"
          [class.border-indigo-600]="activeTab() === 'pending'"
          [class.bg-white]="activeTab() !== 'pending'"
          [class.text-slate-700]="activeTab() !== 'pending'"
          [class.border-slate-200]="activeTab() !== 'pending'"
          (click)="activeTab.set('pending')"
        >
          Pending Requests
        </button>
        <button
          class="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
          [class.bg-indigo-600]="activeTab() === 'sent'"
          [class.text-white]="activeTab() === 'sent'"
          [class.border-indigo-600]="activeTab() === 'sent'"
          [class.bg-white]="activeTab() !== 'sent'"
          [class.text-slate-700]="activeTab() !== 'sent'"
          [class.border-slate-200]="activeTab() !== 'sent'"
          (click)="activeTab.set('sent')"
        >
          Sent Requests
        </button>
      </div>

      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[420px]">
        @if (activeTab() === 'suggested') {
          <div class="px-6 py-4 border-b border-slate-100">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                [formControl]="searchControl"
                placeholder="Search suggested friends..."
                class="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        }
        @if (activeTab() === 'suggested' && isLoading()) {
          <div class="flex-1 flex items-center justify-center p-10">
            <div class="flex flex-col items-center gap-4">
              <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p class="text-slate-500 font-medium">Loading suggestions...</p>
            </div>
          </div>
        } @else if (activeTab() === 'suggested' && error()) {
          <div class="flex-1 flex items-center justify-center p-10 text-center text-red-600">
            <div>
              <p class="text-lg font-medium">Failed to load suggestions</p>
              <p class="mt-2 text-sm">{{ error() }}</p>
              <button (click)="retryLoad()" class="mt-4 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors">Retry</button>
            </div>
          </div>
        } @else if (activeTab() === 'suggested' && suggested().length === 0) {
          <div class="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-500">
            <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 14a4 4 0 10-8 0m8 0a4 4 0 00-8 0m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2v-2" />
              </svg>
            </div>
            <p class="text-lg font-medium text-slate-700">No suggestions right now</p>
            <p class="mt-1">Check back later for new recommendations</p>
          </div>
        } @else if (activeTab() === 'suggested') {
          <div class="flex-1 divide-y divide-slate-100">
            @for (user of suggested(); track user.id) {
              <div class="px-6 py-4 flex items-center gap-4">
                <div class="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                  @if (user.pfp) {
                    <img [src]="avatarUrl(user.pfp)" [alt]="user.fullName || user.username || 'User'" class="w-full h-full object-cover" />
                  } @else {
                    <span class="text-slate-600 font-semibold">{{ getInitials(user.fullName || user.username || '') }}</span>
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-slate-900 truncate">{{ user.fullName || user.username || 'User' }}</p>
                  <p class="text-sm text-slate-500 truncate">@{{ user.username || 'unknown' }}</p>
                </div>
                <button
                  class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  (click)="viewProfile(user.id)"
                >
                  View
                </button>
                <button
                  class="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-colors"
                  (click)="blockUser(user.id)"
                >
                  Block
                </button>
                <button
                  class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                  (click)="sendRequest(user.id)"
                >
                  Add Friend
                </button>
              </div>
            }
          </div>
        }

        @if (activeTab() === 'pending' && pendingLoading()) {
          <div class="flex-1 flex items-center justify-center p-10">
            <div class="flex flex-col items-center gap-4">
              <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p class="text-slate-500 font-medium">Loading requests...</p>
            </div>
          </div>
        } @else if (activeTab() === 'pending' && pendingError()) {
          <div class="flex-1 flex items-center justify-center p-10 text-center text-red-600">
            <div>
              <p class="text-lg font-medium">Failed to load requests</p>
              <p class="mt-2 text-sm">{{ pendingError() }}</p>
              <button (click)="retryPending()" class="mt-4 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors">Retry</button>
            </div>
          </div>
        } @else if (activeTab() === 'pending' && pending().length === 0) {
          <div class="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-500">
            <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7a4 4 0 118 0 4 4 0 01-8 0zm0 10a6 6 0 0112 0v1H8v-1z" />
              </svg>
            </div>
            <p class="text-lg font-medium text-slate-700">No pending requests</p>
            <p class="mt-1">You are all caught up</p>
          </div>
        } @else if (activeTab() === 'pending') {
          <div class="flex-1 divide-y divide-slate-100">
            @for (request of pending(); track request.requesterId) {
              <div class="px-6 py-4 flex items-center gap-4">
                <div class="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                  @if (request.requester?.pfp) {
                    <img [src]="avatarUrl(request.requester?.pfp)" [alt]="requesterName(request)" class="w-full h-full object-cover" />
                  } @else {
                    <span class="text-slate-600 font-semibold">{{ getInitials(requesterName(request)) }}</span>
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-slate-900 truncate">{{ requesterName(request) }}</p>
                  <p class="text-sm text-slate-500 truncate">@{{ request.requester?.username || 'unknown' }}</p>
                </div>
                <button
                  class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  (click)="viewProfile(request.requesterId)"
                >
                  View
                </button>
                <button
                  class="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-colors"
                  (click)="declineRequest(request.requesterId)"
                >
                  Decline
                </button>
                <button
                  class="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
                  (click)="acceptRequest(request.requesterId)"
                >
                  Accept
                </button>
              </div>
            }
          </div>
        }

        @if (activeTab() === 'sent' && sentLoading()) {
          <div class="flex-1 flex items-center justify-center p-10">
            <div class="flex flex-col items-center gap-4">
              <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p class="text-slate-500 font-medium">Loading sent requests...</p>
            </div>
          </div>
        } @else if (activeTab() === 'sent' && sentError()) {
          <div class="flex-1 flex items-center justify-center p-10 text-center text-red-600">
            <div>
              <p class="text-lg font-medium">Failed to load sent requests</p>
              <p class="mt-2 text-sm">{{ sentError() }}</p>
              <button (click)="retrySent()" class="mt-4 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors">Retry</button>
            </div>
          </div>
        } @else if (activeTab() === 'sent' && sent().length === 0) {
          <div class="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-500">
            <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm0 0c0 1.657 1.343 3 3 3s3-1.343 3-3-1.343-3-3-3 3 1.343 3 3zm0 0v4m0 0H8m4 0h4" />
              </svg>
            </div>
            <p class="text-lg font-medium text-slate-700">No sent requests</p>
            <p class="mt-1">Send a request to connect</p>
          </div>
        } @else if (activeTab() === 'sent') {
          <div class="flex-1 divide-y divide-slate-100">
            @for (request of sent(); track request.addresseeId) {
              <div class="px-6 py-4 flex items-center gap-4">
                <div class="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                  @if (request.addressee?.pfp) {
                    <img [src]="avatarUrl(request.addressee?.pfp)" [alt]="addresseeName(request)" class="w-full h-full object-cover" />
                  } @else {
                    <span class="text-slate-600 font-semibold">{{ getInitials(addresseeName(request)) }}</span>
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-slate-900 truncate">{{ addresseeName(request) }}</p>
                  <p class="text-sm text-slate-500 truncate">@{{ request.addressee?.username || 'unknown' }}</p>
                </div>
                <button
                  class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  (click)="viewProfile(request.addresseeId)"
                >
                  View
                </button>
                <button
                  class="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-colors"
                  (click)="cancelRequest(request.addresseeId)"
                >
                  Cancel
                </button>
              </div>
            }
          </div>
        }

        <div class="border-t border-slate-200 bg-slate-50 p-4">
          @if (activeTab() === 'suggested') {
            <app-pagination
              [config]="paginationConfig()"
              [isLoading]="isLoading()"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)"
            ></app-pagination>
          } @else if (activeTab() === 'pending') {
            <app-pagination
              [config]="pendingPaginationConfig()"
              [isLoading]="pendingLoading()"
              (pageChange)="onPendingPageChange($event)"
              (pageSizeChange)="onPendingPageSizeChange($event)"
            ></app-pagination>
          } @else {
            <app-pagination
              [config]="sentPaginationConfig()"
              [isLoading]="sentLoading()"
              (pageChange)="onSentPageChange($event)"
              (pageSizeChange)="onSentPageSizeChange($event)"
            ></app-pagination>
          }
        </div>
      </section>
    </div>
  `
})
export class SuggestedFriendsComponent implements OnInit, OnDestroy {
  private readonly friendshipFacade = inject(FriendshipFacadeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly activeTab = signal<'suggested' | 'pending' | 'sent'>('suggested');

  readonly suggested = signal<UserSummaryUI[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchControl = new FormControl('');

  readonly pending = signal<FriendshipUI[]>([]);
  readonly pendingLoading = signal(false);
  readonly pendingError = signal<string | null>(null);

  readonly sent = signal<FriendshipUI[]>([]);
  readonly sentLoading = signal(false);
  readonly sentError = signal<string | null>(null);

  readonly paginationConfig = signal<PaginationConfig>({
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  });

  readonly pendingPaginationConfig = signal<PaginationConfig>({
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  });

  readonly sentPaginationConfig = signal<PaginationConfig>({
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  });

  private readonly destroy$ = new Subject<void>();

  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const page = parseInt(params['page'] || '0', 10);
      const size = parseInt(params['size'] || '10', 10);
      const pendingPage = parseInt(params['pendingPage'] || '0', 10);
      const pendingSize = parseInt(params['pendingSize'] || '10', 10);
      const sentPage = parseInt(params['sentPage'] || '0', 10);
      const sentSize = parseInt(params['sentSize'] || '10', 10);
      const keyword = params['keyword'] || '';
      if (this.searchControl.value !== keyword) {
        this.searchControl.setValue(keyword, { emitEvent: false });
      }
      this.loadData(page, size);
      this.loadPending(pendingPage, pendingSize);
      this.loadSent(sentPage, sentSize);
    });

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(keyword => {
      this.updateQueryParams({ keyword: keyword || null, page: 0 });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(page: number, size: number) {
    const safePage = Math.max(0, page);
    this.isLoading.set(true);
    this.error.set(null);
    const keyword = this.searchControl.value?.trim() || undefined;

    this.friendshipFacade.getSuggestions({ page: safePage, size, keyword }).subscribe({
      next: res => {
        this.suggested.set(res.items);
        this.paginationConfig.set({
          currentPage: res.currentPage,
          pageSize: res.pageSize,
          totalElements: res.totalItems,
          totalPages: res.totalPages,
          hasNext: res.currentPage < res.totalPages - 1,
          hasPrevious: res.currentPage > 0
        });
        this.isLoading.set(false);
      },
      error: err => {
        console.error('Failed to load suggested friends', err);
        this.error.set(err.message || 'An error occurred while fetching suggestions.');
        this.isLoading.set(false);
      }
    });
  }

  loadPending(page: number, size: number) {
    const safePage = Math.max(0, page);
    this.pendingLoading.set(true);
    this.pendingError.set(null);

    this.friendshipFacade.getPendingRequests({ page: safePage, size }).subscribe({
      next: res => {
        this.pending.set(res.items);
        this.pendingPaginationConfig.set({
          currentPage: res.currentPage,
          pageSize: res.pageSize,
          totalElements: res.totalItems,
          totalPages: res.totalPages,
          hasNext: res.currentPage < res.totalPages - 1,
          hasPrevious: res.currentPage > 0
        });
        this.pendingLoading.set(false);
      },
      error: err => {
        console.error('Failed to load pending requests', err);
        this.pendingError.set(err.message || 'An error occurred while fetching requests.');
        this.pendingLoading.set(false);
      }
    });
  }

  loadSent(page: number, size: number) {
    const safePage = Math.max(0, page);
    this.sentLoading.set(true);
    this.sentError.set(null);

    this.friendshipFacade.getSentRequests({ page: safePage, size }).subscribe({
      next: res => {
        this.sent.set(res.items);
        this.sentPaginationConfig.set({
          currentPage: res.currentPage,
          pageSize: res.pageSize,
          totalElements: res.totalItems,
          totalPages: res.totalPages,
          hasNext: res.currentPage < res.totalPages - 1,
          hasPrevious: res.currentPage > 0
        });
        this.sentLoading.set(false);
      },
      error: err => {
        console.error('Failed to load sent requests', err);
        this.sentError.set(err.message || 'An error occurred while fetching sent requests.');
        this.sentLoading.set(false);
      }
    });
  }

  retryLoad() {
    const params = this.route.snapshot.queryParams;
    this.loadData(
      parseInt(params['page'] || '0', 10),
      parseInt(params['size'] || '10', 10)
    );
  }

  retryPending() {
    const params = this.route.snapshot.queryParams;
    this.loadPending(
      parseInt(params['pendingPage'] || '0', 10),
      parseInt(params['pendingSize'] || '10', 10)
    );
  }

  retrySent() {
    const params = this.route.snapshot.queryParams;
    this.loadSent(
      parseInt(params['sentPage'] || '0', 10),
      parseInt(params['sentSize'] || '10', 10)
    );
  }

  onPageChange(page: number) {
    this.updateQueryParams({ page });
  }

  onPageSizeChange(size: number) {
    this.updateQueryParams({ size, page: 0 });
  }

  onPendingPageChange(page: number) {
    this.updateQueryParams({ pendingPage: page });
  }

  onPendingPageSizeChange(size: number) {
    this.updateQueryParams({ pendingSize: size, pendingPage: 0 });
  }

  onSentPageChange(page: number) {
    this.updateQueryParams({ sentPage: page });
  }

  onSentPageSizeChange(size: number) {
    this.updateQueryParams({ sentSize: size, sentPage: 0 });
  }

  updateQueryParams(queryParams: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  sendRequest(userId: number) {
    this.friendshipFacade.sendRequest(userId).subscribe({
      next: () => {
        this.suggested.set(this.suggested().filter(u => u.id !== userId));
        this.loadSent(0, this.sentPaginationConfig().pageSize);
      },
      error: err => {
        console.error('Failed to send friend request', err);
      }
    });
  }

  acceptRequest(requesterId: number) {
    if (!requesterId || requesterId <= 0) {
      return;
    }

    this.friendshipFacade.acceptRequest(requesterId).subscribe({
      next: () => {
        this.pending.set(this.pending().filter(r => r.requesterId !== requesterId));
      },
      error: err => {
        console.error('Failed to accept friend request', err);
      }
    });
  }

  blockUser(userId: number) {
    if (!userId || userId <= 0) {
      return;
    }

    if (!confirm('Block this user?')) {
      return;
    }

    this.friendshipFacade.blockUser(userId).subscribe({
      next: () => {
        this.pending.set(this.pending().filter(r => r.requesterId !== userId));
        this.suggested.set(this.suggested().filter(u => u.id !== userId));
        this.sent.set(this.sent().filter(r => r.addresseeId !== userId));
      },
      error: err => {
        const message = (err?.message || '').toLowerCase();
        if (message.includes('already exists')) {
          this.pending.set(this.pending().filter(r => r.requesterId !== userId));
          this.suggested.set(this.suggested().filter(u => u.id !== userId));
          return;
        }
        console.error('Failed to block user', err);
      }
    });
  }

  cancelRequest(userId: number) {
    if (!userId || userId <= 0) {
      return;
    }

    this.friendshipFacade.deleteFriendship(userId).subscribe({
      next: () => {
        this.sent.set(this.sent().filter(r => r.addresseeId !== userId));
      },
      error: err => {
        console.error('Failed to cancel friend request', err);
      }
    });
  }

  declineRequest(userId: number) {
    if (!userId || userId <= 0) {
      return;
    }

    this.friendshipFacade.deleteFriendship(userId).subscribe({
      next: () => {
        this.pending.set(this.pending().filter(r => r.requesterId !== userId));
      },
      error: err => {
        console.error('Failed to decline friend request', err);
      }
    });
  }

  viewProfile(userId: number) {
    if (!userId || userId <= 0) {
      return;
    }
    this.router.navigate(['/dashboard/client/profile', userId]);
  }

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  avatarUrl(pfp?: string | null): string {
    if (!pfp) {
      return '';
    }
    return `http://localhost:8081/uploads/${pfp}`;
  }

  requesterName(request: FriendshipUI): string {
    const requester = request.requester;
    return requester?.fullName || `${requester?.firstName ?? ''} ${requester?.lastName ?? ''}`.trim() || requester?.username || `User #${request.requesterId}`;
  }

  addresseeName(request: FriendshipUI): string {
    const addressee = request.addressee;
    return addressee?.fullName || `${addressee?.firstName ?? ''} ${addressee?.lastName ?? ''}`.trim() || addressee?.username || `User #${request.addresseeId}`;
  }
}
