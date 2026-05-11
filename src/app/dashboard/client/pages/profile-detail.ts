import { Component, inject, OnDestroy, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { UserFacadeService } from '../../../api/facades/user.facade';
import { PostFacadeService } from '../../../api/facades/post.facade';
import { FriendshipFacadeService } from '../../../api/facades/friendship.facade';
import { UserUI } from '../../../api/facades/models/user.model';
import { PostUI } from '../../../api/facades/models/post.model';
import { PaginationComponent, PaginationConfig } from '../../../shared/pagination/pagination.component';
import { PostCardComponent } from '../modals/posts';
import { HttpClient } from '@angular/common/http';
import { BadgesDisplayComponent } from '../../layout/badges-display';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule, PaginationComponent, PostCardComponent,BadgesDisplayComponent],
  template: `
    <div class="flex flex-col gap-6 pb-10">
      <h2 class="text-2xl font-bold text-slate-900">Profile</h2>

      <!-- Profile card -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        @if (isLoading()) {
          <div class="p-10 flex items-center justify-center">
            <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        } @else if (error()) {
          <div class="p-10 text-center text-red-600">
            <p class="text-lg font-medium">Failed to load profile</p>
            <p class="mt-2 text-sm">{{ error() }}</p>
          </div>
        } @else if (user()) {
          <div class="p-6 flex items-center gap-4">
            <div class="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
              @if (user()?.pfp) {
                <img [src]="avatarUrl(user()?.pfp)" [alt]="displayName()" class="w-full h-full object-cover" />
              } @else {
                <span class="text-slate-600 font-semibold text-lg">{{ initials() }}</span>
              }
            </div>
            <div>
              <p class="text-xl font-bold text-slate-900">{{ displayName() }}</p>
              <p class="text-sm text-slate-500">@{{ user()?.username || 'unknown' }}</p>
              @if (isBlocked()) {
                <span class="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  You have blocked this user
                </span>
              }
            </div>
            <div class="ml-auto flex items-center gap-2">
              @if (friendshipLoading()) {
                <span class="text-xs text-slate-400">Checking...</span>
              } @else if (isBlocked()) {
                <button class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors" (click)="goToSettings()">
                  Unblock in Settings
                </button>
              } @else if (isFriend()) {
                <button class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors" (click)="removeFriend()">
                  Remove Friend
                </button>
                <button class="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-colors" (click)="blockUser()">
                  Block
                </button>
              } @else if (hasSentRequest()) {
                <button class="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-colors" (click)="cancelRequest()">
                  Cancel Request
                </button>
              } @else {
                <button class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors" (click)="addFriend()">
                  Add Friend
                </button>
              }
            </div>
          </div>
        }
      </section>
      <!-- Badges -->
@if (!isBlocked() && userBadges().length > 0) {
  <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
    <app-badges-display [badges]="userBadges()" />
  </section>
}
@if (!isBlocked()) {
  <section class="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Communities</h3>
      @if (userCommunities().length > 3) {
        <button class="text-xs font-semibold text-indigo-600 hover:text-indigo-700" (click)="communitiesModalOpen.set(true)">
          View all ({{ userCommunities().length }})
        </button>
      }
    </div>
    @if (communitiesLoading()) {
      <div class="flex justify-center py-4">
        <div class="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    } @else if (userCommunities().length === 0) {
      <p class="text-sm text-slate-400">Not a member of any community yet.</p>
    } @else {
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        @for (community of displayedCommunities(); track community.id) {
          <div (click)="navigateToCommunity(community.id)" class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
            <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {{ community.title?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-900 truncate">{{ community.title }}</p>
              <p class="text-xs text-slate-400">{{ community.nbrMembers }} members</p>
            </div>
          </div>
        }
      </div>
    }
  </section>
}

<!-- Communities Modal -->
@if (communitiesModalOpen()) {
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-[fadeIn_0.15s_ease]" (click)="communitiesModalOpen.set(false)">
    <div class="bg-white rounded-2xl w-[min(600px,92vw)] shadow-2xl overflow-hidden" (click)="$event.stopPropagation()">
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-900">Communities</h3>
        <button class="text-slate-400 hover:text-slate-600 text-xl" (click)="communitiesModalOpen.set(false)">✕</button>
      </div>
      <div class="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
        @for (community of userCommunities(); track community.id) {
          <div (click)="navigateToCommunity(community.id); communitiesModalOpen.set(false)" class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
            <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {{ community.title?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-900 truncate">{{ community.title }}</p>
              <p class="text-xs text-slate-400">{{ community.nbrMembers }} members</p>
            </div>
          </div>
        }
      </div>
    </div>
  </div>
}

      <!-- Blocked user content notice -->
      @if (isBlocked()) {
        <div class="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <svg class="w-10 h-10 text-rose-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p class="text-rose-700 font-semibold">You have blocked this user. Unblock them in Settings to see their content.</p>
          <button class="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors" (click)="goToSettings()">
            Go to Settings
          </button>
        </div>
      }

      <!-- Posts -->
      @if (!isBlocked()) {
        <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[420px]">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Posts</h3>
            <span class="text-xs text-slate-400">{{ paginationConfig().totalElements }} post{{ paginationConfig().totalElements !== 1 ? 's' : '' }}</span>
          </div>

          @if (postsLoading()) {
            <div class="flex-1 flex items-center justify-center p-10">
              <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          } @else if (approvedPosts().length === 0) {
            <div class="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-500">
              <p class="text-lg font-medium text-slate-700">No posts yet</p>
              <p class="mt-1">This user hasn't posted anything</p>
            </div>
          } @else {
            <div class="flex-1 divide-y divide-slate-100">
              @for (post of approvedPosts(); track post.id) {
                <app-post-card
                  [post]="post"
                  [showLike]="true"
                  [showComments]="true"
                  [showReport]="true"
                  [showCommunity]="true"
                  [showOwnerDelete]="false"
                  [showEdit]="false"
                  [showApprove]="false"
                />
              }
            </div>
          }

          <div class="border-t border-slate-200 bg-slate-50 p-4">
            <app-pagination
              [config]="paginationConfig()"
              [isLoading]="postsLoading()"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)">
            </app-pagination>
          </div>
        </section>
      }
    </div>

    <!-- Block Confirm Modal -->
    @if (blockConfirm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" (click)="blockConfirm.set(false)">
        <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-bold text-slate-900 mb-2">Block User</h3>
          <p class="text-sm text-slate-600 mb-6">Are you sure you want to block <span class="font-semibold">{{ displayName() }}</span>? They won't be able to see your profile or contact you.</p>
          <div class="flex gap-3 justify-end">
            <button class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors" (click)="blockConfirm.set(false)">Cancel</button>
            <button class="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors" (click)="confirmBlock()">Block</button>
          </div>
        </div>
      </div>
    }
  `
})
export class ProfileDetailComponent implements OnInit, OnDestroy {
  private readonly route            = inject(ActivatedRoute);
  private readonly router           = inject(Router);
  private readonly userFacade       = inject(UserFacadeService);
  private readonly postFacade       = inject(PostFacadeService);
  private readonly friendshipFacade = inject(FriendshipFacadeService);
  private readonly http = inject(HttpClient);

  readonly user             = signal<UserUI | null>(null);
  readonly isLoading        = signal(false);
  readonly error            = signal<string | null>(null);
  readonly posts            = signal<PostUI[]>([]);
  readonly postsLoading     = signal(false);
  readonly isFriend         = signal(false);
  readonly friendshipLoading = signal(false);
  readonly hasSentRequest   = signal(false);
  readonly isBlocked        = signal(false);
  readonly blockConfirm     = signal(false);
  readonly communitiesModalOpen = signal(false);
  readonly displayedCommunities = computed(() => this.userCommunities().slice(0, 3));

  readonly userBadges = computed(() => this.user()?.badges ?? []);
  readonly userCommunities = signal<any[]>([]);
  readonly communitiesLoading = signal(false);


  readonly paginationConfig = signal<PaginationConfig>({
    totalPages: 0, totalElements: 0, currentPage: 0,
    pageSize: 10, hasNext: false, hasPrevious: false
  });

  // Filter out pending posts — only show approved ones
  readonly approvedPosts = computed(() =>
    this.posts().filter(p => p.status === 'Approved' || p.status === '')
  );

  private readonly destroy$ = new Subject<void>();

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = parseInt(params.get('id') || '0', 10);
      if (id > 0) {
        this.loadUser(id);
        this.loadPosts(id, 0, this.paginationConfig().pageSize);
        this.loadFriendshipStatus(id);
        this.loadSentStatus(id);
        this.loadBlockedStatus(id);
        this.loadUserCommunities(id);
      }
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  // ── USER ──────────────────────────────────────────────────────────────────

  loadUser(id: number) {
    this.isLoading.set(true);
    this.error.set(null);
    this.userFacade.getById(id).subscribe({
      next: res => { this.user.set(res); this.isLoading.set(false); },
      error: err => { this.error.set(err.message || 'Failed to load profile.'); this.isLoading.set(false); }
    });
  }

  // ── POSTS ─────────────────────────────────────────────────────────────────

  loadPosts(userId: number, page: number, size: number) {
    this.postsLoading.set(true);
    this.postFacade.getByUser(userId, { page: Math.max(0, page), size }).subscribe({
      next: res => {
        this.posts.set(res.items);
        this.paginationConfig.set({
          currentPage: res.currentPage, pageSize: res.pageSize,
          totalElements: res.totalItems, totalPages: res.totalPages,
          hasNext: res.currentPage < res.totalPages - 1,
          hasPrevious: res.currentPage > 0
        });
        this.postsLoading.set(false);
      },
      error: () => this.postsLoading.set(false)
    });
  }

  onPageChange(page: number) {
    const id = this.user()?.id;
    if (id) this.loadPosts(id, page, this.paginationConfig().pageSize);
  }

  onPageSizeChange(size: number) {
    const id = this.user()?.id;
    if (id) this.loadPosts(id, 0, size);
  }
    // ── COMMUNITIES ────────────────────────────────────────────────────────────
  async loadUserCommunities(userId: number) {
  this.communitiesLoading.set(true);
  try {
    const result: any = await firstValueFrom(
      this.http.get(`http://localhost:8081/api/communities/user/${userId}`)
    );
    this.userCommunities.set(result.content ?? result ?? []);
  } catch (err) {
    console.error('Failed to load communities', err);
  } finally {
    this.communitiesLoading.set(false);
  }
}

  // ── FRIENDSHIP ────────────────────────────────────────────────────────────

  loadFriendshipStatus(id: number) {
    this.friendshipLoading.set(true);
    this.friendshipFacade.isFriend(id).subscribe({
      next: res => { this.isFriend.set(Boolean(res)); this.friendshipLoading.set(false); },
      error: () => { this.isFriend.set(false); this.friendshipLoading.set(false); }
    });
  }

  loadSentStatus(id: number) {
    this.friendshipFacade.getSentRequests({ page: 0, size: 50 }).subscribe({
      next: res => this.hasSentRequest.set(res.items.some((item: any) => item.addresseeId === id)),
      error: () => this.hasSentRequest.set(false)
    });
  }

  addFriend() {
    const id = this.user()?.id; if (!id) return;
    this.friendshipFacade.sendRequest(id).subscribe({
      next: () => { this.isFriend.set(false); this.hasSentRequest.set(true); }
    });
  }

  cancelRequest() {
    const id = this.user()?.id; if (!id) return;
    this.friendshipFacade.deleteFriendship(id).subscribe({
      next: () => this.hasSentRequest.set(false)
    });
  }

  removeFriend() {
    const id = this.user()?.id; if (!id) return;
    this.friendshipFacade.deleteFriendship(id).subscribe({
      next: () => this.isFriend.set(false)
    });
  }

  blockUser() { this.blockConfirm.set(true); }

  confirmBlock() {
    const id = this.user()?.id; if (!id) return;
    this.blockConfirm.set(false);
    this.friendshipFacade.blockUser(id).subscribe({
      next: () => { this.isFriend.set(false); this.hasSentRequest.set(false); this.isBlocked.set(true); }
    });
  }

  loadBlockedStatus(profileUserId: number) {
    this.friendshipFacade.getBlockedUsers({ page: 0, size: 100 }).subscribe({
      next: res => this.isBlocked.set(res.items.some((u: any) => u.id === profileUserId)),
      error: () => {}
    });
  }
    // ── BADGES ─────────────────────────────────────────────────────────────────
  getBadgeEmoji(type: string): string {
  const map: { [key: string]: string } = {
    'BEGINNER': '🌱', 'LEARNER': '📚', 'EXPLORER': '🗺️',
    'CONTRIBUTOR': '💡', 'HELPER': '🤝', 'CONSISTENT': '🔥',
    'COLLABORATOR': '👥', 'ACHIEVER': '🏆', 'MENTOR': '🎓', 'LEGEND': '⭐'
  };
  return map[type] || '🎖️';
}

  // ── UTILS ─────────────────────────────────────────────────────────────────

  goToSettings(): void { this.router.navigate(['/dashboard/client/settings']); }
  navigateToCommunity(communityId?: number): void {
    if (communityId) this.router.navigate(['/dashboard/client/community', communityId]);
  }

  displayName(): string {
    const u = this.user();
    return `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || u?.username || 'User';
  }

  initials(): string {
    const name = this.displayName();
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  avatarUrl(pfp?: string | null): string {
    if (!pfp) return '';
    if (pfp.startsWith('http')) return pfp;
    if (pfp.startsWith('/uploads/')) return `http://localhost:8081${pfp}`;
    return `http://localhost:8081/uploads/${pfp}`;
  }

  getTimeAgo(date: Date | string | null | undefined): string {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}