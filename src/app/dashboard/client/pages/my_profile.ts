import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserContextService } from '../../../services/user-context.service';
import { BadgesDisplayComponent } from '../../layout/badges-display';
import { UserFacadeService } from '../../../api/facades/user.facade';
import { PostFacadeService } from '../../../api/facades/post.facade';
import { FriendshipFacadeService } from '../../../api/facades/friendship.facade';
import { PostUI } from '../../../api/facades/models/post.model';
import { UserSummaryUI } from '../../../api/facades/models/friendship.model';
import { PaginationComponent, PaginationConfig } from '../../../shared/pagination/pagination.component';
import { PostCardComponent } from '../modals/posts';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, BadgesDisplayComponent, PaginationComponent, PostCardComponent],
  template: `
    <article class="relative rounded-3xl overflow-hidden bg-white shadow-sm ring-1 ring-indigo-500/10 w-full">

      <!-- Banner -->
      <div class="relative h-44 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500 overflow-hidden">
        <div class="absolute -top-10 -left-8 w-40 h-40 rounded-full bg-indigo-400 blur-3xl opacity-30 animate-pulse"></div>
        <div class="absolute top-2 right-10 w-28 h-28 rounded-full bg-fuchsia-400 blur-3xl opacity-30 animate-pulse delay-300"></div>
        <div class="absolute -bottom-4 left-1/2 w-20 h-20 rounded-full bg-purple-400 blur-2xl opacity-30 animate-pulse delay-700"></div>
      </div>

      <!-- Body -->
      <div class="px-8 pb-8">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 -mt-11">
          <div class="flex flex-col gap-4">
            <div class="flex items-end gap-5">

              <!-- Avatar -->
              <div class="relative w-28 h-28 flex-shrink-0">
                <div class="absolute -inset-[3px] rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 z-0"></div>
                <div class="absolute -inset-[3px] rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 blur-md opacity-50 z-[-1]"></div>
                <div class="relative z-10 w-full h-full rounded-[1.1rem] overflow-hidden bg-indigo-100">
                  @if (pfp()) {
                    <img [src]="pfp()" [alt]="displayName()" class="w-full h-full object-cover" />
                  } @else {
                    <div class="flex items-center justify-center h-full bg-gradient-to-br from-indigo-500 to-purple-500">
                      <span class="text-white text-3xl font-extrabold tracking-tight">{{ initials() }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Name + chips -->
              <div class="pb-1">
                <p class="text-[0.65rem] font-semibold tracking-[0.22em] uppercase bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-1">Profile</p>
                <h2 class="text-3xl font-extrabold tracking-tighter text-slate-900 leading-tight mb-2">{{ displayName() }}</h2>
                <div class="flex flex-wrap gap-1.5">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 ring-1 ring-slate-200">&#64;{{ username() }}</span>
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-600 ring-1 ring-indigo-200">Lv.&nbsp;{{ level() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- XP bar -->
        <div class="h-px bg-gradient-to-r from-indigo-100 via-purple-100 to-transparent my-5"></div>
        <div class="flex justify-between text-[0.7rem] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
          <span>Experience</span>
          <span>{{ xp().toLocaleString() }} XP</span>
        </div>
        <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-[length:200%] animate-[flow_2.5s_linear_infinite] transition-all duration-500"
            [style.width]="xpPercent() + '%'"
          ></div>
        </div>
        <p class="text-xs text-slate-400 mt-1 text-right">{{ xpToNextBadge() }}</p>

        <!-- Badges -->
        <div class="h-px bg-gradient-to-r from-indigo-100 via-purple-100 to-transparent my-5"></div>
       <div class="flex items-center justify-between mb-2">
      <span></span>
    </div>
       <app-badges-display [badges]="badges()" />
        <!-- Friends Preview -->
        <div class="h-px bg-gradient-to-r from-indigo-100 via-purple-100 to-transparent my-5"></div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Friends</h3>
          <button class="text-xs font-semibold text-indigo-600 hover:text-indigo-700" (click)="openFriends()">View all</button>
        </div>

        @if (friendsPreviewLoading()) {
          <div class="flex justify-center py-6">
            <div class="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        } @else if (friendsPreview().length === 0) {
          <div class="text-center py-6 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
            <p class="text-slate-400 text-sm">No friends yet.</p>
          </div>
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            @for (friend of friendsPreview(); track friend.id) {
              <div (click)="viewFriendProfile(friend.id)" class="flex items-center gap-3 p-3 rounded-xl bg-white ring-1 ring-slate-100 cursor-pointer hover:bg-indigo-50 transition-colors">
                <div class="w-10 h-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                  @if (friend.pfp) {
                    <img [src]="friendAvatarUrl(friend.pfp)" [alt]="friend.fullName || friend.username || 'User'" class="w-full h-full object-cover" />
                  } @else {
                    <span class="text-slate-600 font-semibold text-sm">{{ friendInitials(friend) }}</span>
                  }
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-slate-900 truncate">{{ friend.fullName || friend.username || 'User' }}</p>
                  <p class="text-xs text-slate-500 truncate">@{{ friend.username || 'unknown' }}</p>
                </div>
              </div>
            }
          </div>
        }

        <!-- ── My Posts ── -->
        <div class="h-px bg-gradient-to-r from-indigo-100 via-purple-100 to-transparent my-5"></div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">My Posts</h3>
          <span class="text-xs text-slate-400">{{ posts().length }} post{{ posts().length !== 1 ? 's' : '' }}</span>
        </div>

        @if (postsLoading()) {
          <div class="flex justify-center py-8">
            <div class="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        } @else if (posts().length === 0) {
          <div class="text-center py-8 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
            <p class="text-slate-400 text-sm">You haven't posted anything yet.</p>
          </div>
        } @else {
          <div class="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-100 overflow-hidden">
            @for (post of posts(); track post.id) {
          <app-post-card
            [post]="post"
            [showLike]="true"
            [showComments]="true"
            [showReport]="false"
            [showCommunity]="true"
            [showOwnerDelete]="true"
            [showEdit]="true"
            [isProfilePage]="true"
            (postDeleted)="onPostDeleted($event)"
            (postUpdated)="onPostUpdated($event)"
          />
            }
          </div>
        }
        <!-- ── End My Posts ── -->
      </div>
    </article>

    <!-- Upload Modal -->
    @if (modalOpen()) {
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-[fadeIn_0.15s_ease]" (click)="closeModal()">
        <div class="bg-white rounded-2xl p-8 w-[min(420px,90vw)] shadow-2xl animate-[slideUp_0.2s_ease]" (click)="$event.stopPropagation()">
          <h3 class="text-xl font-extrabold text-slate-900 mb-1">Upload Profile Picture</h3>
          <p class="text-sm text-slate-400 mb-6">JPG, PNG or WebP · Max 5MB</p>
          @if (errorMsg()) {
            <div class="mb-4 px-4 py-3 rounded-xl bg-red-50 ring-1 ring-red-200 text-sm text-red-600">{{ errorMsg() }}</div>
          }
          <label class="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-indigo-200 rounded-xl p-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200 group" for="pfp-input">
            <span class="text-4xl group-hover:scale-110 transition-transform duration-200">🖼️</span>
            <div class="text-center">
              <p class="text-sm font-semibold text-slate-700">Click to browse</p>
              <p class="text-xs text-slate-400 mt-0.5">or drag and drop your image here</p>
            </div>
            <input id="pfp-input" type="file" accept="image/*" class="hidden" (change)="onFileSelected($event)" />
          </label>
          @if (previewUrl()) {
            <div class="mt-5 flex items-center gap-4 p-3 bg-slate-50 rounded-xl ring-1 ring-slate-100">
              <img [src]="previewUrl()!" class="w-14 h-14 rounded-xl object-cover" alt="Preview" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-700 truncate">{{ selectedFile()?.name }}</p>
                <p class="text-xs text-slate-400">{{ fileSizeLabel() }}</p>
              </div>
              <button (click)="clearFile()" class="text-slate-400 hover:text-red-400 transition-colors text-lg leading-none">✕</button>
            </div>
          }
          <div class="flex gap-3 mt-6">
            <button (click)="closeModal()" class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
            <button [disabled]="!selectedFile() || uploading()" (click)="uploadPfp()" class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
              @if (uploading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Uploading...
                </span>
              } @else { Upload }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Friends Modal -->
    @if (friendsOpen()) {
      <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-[fadeIn_0.15s_ease]" (click)="closeFriends()">
        <div class="bg-white rounded-2xl w-[min(720px,92vw)] shadow-2xl overflow-hidden animate-[slideUp_0.2s_ease]" (click)="$event.stopPropagation()">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-slate-900">Friends</h3>
              <p class="text-xs text-slate-400">{{ friendsPaginationConfig().totalElements }} total</p>
            </div>
            <button class="text-slate-400 hover:text-slate-600" (click)="closeFriends()">✕</button>
          </div>
          @if (friendsLoading()) {
            <div class="p-10 flex items-center justify-center">
              <div class="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          } @else if (friendsError()) {
            <div class="p-10 text-center text-red-600">
              <p class="text-lg font-medium">Failed to load friends</p>
              <p class="mt-2 text-sm">{{ friendsError() }}</p>
            </div>
          } @else if (friendsList().length === 0) {
            <div class="p-10 text-center text-slate-500">
              <p class="text-lg font-medium text-slate-700">No friends yet</p>
              <p class="mt-1">Start adding friends from suggestions</p>
            </div>
          } @else {
            <div class="divide-y divide-slate-100 max-h-[60vh] overflow-auto">
              @for (friend of friendsList(); track friend.id) {
                <div class="px-6 py-4 flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0">
                    @if (friend.pfp) {
                      <img [src]="friendAvatarUrl(friend.pfp)" [alt]="friend.fullName || friend.username || 'User'" class="w-full h-full object-cover" />
                    } @else {
                      <span class="text-slate-600 font-semibold">{{ friendInitials(friend) }}</span>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-slate-900 truncate">{{ friend.fullName || friend.username || 'User' }}</p>
                    <p class="text-sm text-slate-500 truncate">@{{ friend.username || 'unknown' }}</p>
                  </div>
                  <button class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors" (click)="viewFriendProfile(friend.id)">View</button>
                </div>
              }
            </div>
          }
          <div class="border-t border-slate-200 bg-slate-50 p-4">
            <app-pagination
              [config]="friendsPaginationConfig()"
              [isLoading]="friendsLoading()"
              (pageChange)="onFriendsPageChange($event)"
              (pageSizeChange)="onFriendsPageSizeChange($event)"
            ></app-pagination>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes flow {
      0%   { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(16px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly userContext      = inject(UserContextService);
  private readonly userFacade       = inject(UserFacadeService);
  private readonly postFacade       = inject(PostFacadeService);
  private readonly friendshipFacade = inject(FriendshipFacadeService);
  private readonly router           = inject(Router);

  readonly user = this.userContext.user;

  // ── Modal ──
  readonly modalOpen    = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl   = signal<string | null>(null);
  readonly uploading    = signal(false);
  readonly errorMsg     = signal<string | null>(null);
  readonly localPfp     = signal<string | null>(null);

  // ── Posts ──
  readonly posts       = signal<PostUI[]>([]);
  readonly postsLoading = signal(true);

  // ── Friends ──
  readonly friendsPreview          = signal<UserSummaryUI[]>([]);
  readonly friendsPreviewLoading   = signal(true);
  readonly friendsOpen             = signal(false);
  readonly friendsList             = signal<UserSummaryUI[]>([]);
  readonly friendsLoading          = signal(false);
  readonly friendsError            = signal<string | null>(null);
  readonly friendsPaginationConfig = signal<PaginationConfig>({
    totalPages: 0, totalElements: 0, currentPage: 0,
    pageSize: 10, hasNext: false, hasPrevious: false
  });

  ngOnInit() {
    this.loadMyPosts();
    this.loadFriendsPreview();
  }

  // ── Posts ──────────────────────────────────────────────────────────────────

  private async loadMyPosts() {
    this.postsLoading.set(true);
    try {
      const res = await firstValueFrom(this.postFacade.getMy());
      this.posts.set(res.items);
    } catch (err) {
      console.error('[Profile] Failed to load posts', err);
    } finally {
      this.postsLoading.set(false);
    }
  }

  onPostDeleted(postId: number): void {
    this.posts.update(list => list.filter(p => p.id !== postId));
  }

  onPostUpdated(updated: PostUI): void {
    this.posts.update(list => list.map(p => p.id === updated.id ? updated : p));
  }

  // ── Friends ────────────────────────────────────────────────────────────────

  private loadFriendsPreview() {
    this.friendsPreviewLoading.set(true);
    this.friendshipFacade.getFriends({ page: 0, size: 6 }).subscribe({
      next: res => { this.friendsPreview.set(res.items); this.friendsPreviewLoading.set(false); },
      error: err => { console.error(err); this.friendsPreview.set([]); this.friendsPreviewLoading.set(false); }
    });
  }

  private loadFriends(page: number, size: number) {
    this.friendsLoading.set(true);
    this.friendsError.set(null);
    this.friendshipFacade.getFriends({ page: Math.max(0, page), size }).subscribe({
      next: res => {
        this.friendsList.set(res.items);
        this.friendsPaginationConfig.set({
          currentPage: res.currentPage, pageSize: res.pageSize,
          totalElements: res.totalItems, totalPages: res.totalPages,
          hasNext: res.currentPage < res.totalPages - 1,
          hasPrevious: res.currentPage > 0
        });
        this.friendsLoading.set(false);
      },
      error: err => {
        this.friendsError.set(err.message || 'Failed to load friends.');
        this.friendsLoading.set(false);
      }
    });
  }

  openFriends() { this.friendsOpen.set(true); this.loadFriends(0, this.friendsPaginationConfig().pageSize); }
  closeFriends() { this.friendsOpen.set(false); }
  onFriendsPageChange(page: number) { this.loadFriends(page, this.friendsPaginationConfig().pageSize); }
  onFriendsPageSizeChange(size: number) { this.loadFriends(0, size); }
  viewFriendProfile(friendId: number) { if (friendId) this.router.navigate(['/dashboard/client/profile', friendId]); }

  // ── Upload modal ───────────────────────────────────────────────────────────

  openModal()  { this.modalOpen.set(true); this.errorMsg.set(null); }
  closeModal() { this.modalOpen.set(false); this.clearFile(); this.errorMsg.set(null); }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.errorMsg.set(null);
    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  clearFile() { this.selectedFile.set(null); this.previewUrl.set(null); }

  fileSizeLabel(): string {
    const size = this.selectedFile()?.size ?? 0;
    return size < 1024 * 1024
      ? (size / 1024).toFixed(1) + ' KB'
      : (size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  uploadPfp() {
    const file = this.selectedFile();
    if (!file) return;
    this.uploading.set(true);
    this.errorMsg.set(null);
    this.userFacade.uploadPfp(file).subscribe({
      next: (updatedUser) => {
        this.userContext.setUser(updatedUser);
        this.localPfp.set(updatedUser.pfp ? `${environment.apiBaseUrl}/uploads/${updatedUser.pfp}` : null);
        this.uploading.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.errorMsg.set(err?.message ?? 'Upload failed, please try again.');
        this.uploading.set(false);
      }
    });
  }

  // ── Computed ───────────────────────────────────────────────────────────────

  readonly displayName = computed(() => {
    const u = this.user();
    return `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || u?.username || 'Student';
  });

  readonly username  = computed(() => this.user()?.username ?? '');
  readonly level     = computed(() => this.user()?.level ?? 1);
  readonly xp        = computed(() => this.user()?.xpPts ?? 0);
  readonly badges    = computed(() => this.user()?.badges ?? []);

  readonly xpPercent = computed(() => {
    const xp = this.xp();
    const tiers = [0, 500, 2000, 5000];
    let tierStart = 0, tierEnd = 500;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (xp >= tiers[i]) { tierStart = tiers[i]; tierEnd = tiers[i + 1] ?? tiers[i] + 5000; break; }
    }
    return Math.min(100, ((xp - tierStart) / (tierEnd - tierStart)) * 100);
  });

  readonly xpToNextBadge = computed(() => {
    const xp = this.xp();
    if (xp >= 5000) return 'Max level reached';
    if (xp >= 2000) return `${(5000 - xp).toLocaleString()} XP to Master`;
    if (xp >= 500)  return `${(2000 - xp).toLocaleString()} XP to Explorer`;
    return `${(500 - xp).toLocaleString()} XP to Learner`;
  });

  readonly pfp = computed(() => {
    if (this.localPfp()) return this.localPfp()!;
    const p = this.user()?.pfp;
    return p ? `${environment.apiBaseUrl}/uploads/${p}` : undefined;
  });

  // ── Utils ──────────────────────────────────────────────────────────────────

  uploadUrl(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/uploads/')) return `${environment.apiBaseUrl}${path}`;
    return `${environment.apiBaseUrl}/uploads/${path}`;
  }

  friendAvatarUrl(pfp?: string | null): string { return this.uploadUrl(pfp ?? undefined); }

  friendInitials(friend: UserSummaryUI): string {
    const name = friend.fullName?.trim() || friend.username?.trim() || 'User';
    const parts = name.split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  initials(): string {
    const parts = this.displayName().trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : this.displayName().substring(0, 2).toUpperCase();
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