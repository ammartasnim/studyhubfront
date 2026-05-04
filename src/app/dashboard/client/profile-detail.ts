import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { UserFacadeService } from '../../api/facades/user.facade';
import { PostFacadeService } from '../../api/facades/post.facade';
import { FriendshipFacadeService } from '../../api/facades/friendship.facade';
import { UserUI } from '../../api/facades/models/user.model';
import { PostUI } from '../../api/facades/models/post.model';
import { PaginationComponent, PaginationConfig } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <div class="flex flex-col gap-6 pb-10">
      <div class="flex items-center gap-3">
        <button
          class="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          (click)="goBack()"
        >
          Back
        </button>
        <h2 class="text-2xl font-bold text-slate-900">Profile</h2>
      </div>

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
            </div>
            <div class="ml-auto flex items-center gap-2">
              @if (friendshipLoading()) {
                <span class="text-xs text-slate-400">Checking...</span>
              } @else if (isFriend()) {
                <button
                  class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  (click)="removeFriend()"
                >
                  Remove Friend
                </button>
                <button
                  class="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-colors"
                  (click)="blockUser()"
                >
                  Block
                </button>
              } @else if (hasSentRequest()) {
                <button
                  class="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 font-semibold hover:bg-rose-50 transition-colors"
                  (click)="cancelRequest()"
                >
                  Cancel Request
                </button>
              } @else {
                <button
                  class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                  (click)="addFriend()"
                >
                  Add Friend
                </button>
              }
            </div>
          </div>
        }
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[420px]">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Posts</h3>
          <span class="text-xs text-slate-400">{{ posts().length }} post{{ posts().length !== 1 ? 's' : '' }}</span>
        </div>

        @if (postsLoading()) {
          <div class="flex-1 flex items-center justify-center p-10">
            <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        } @else if (posts().length === 0) {
          <div class="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-500">
            <p class="text-lg font-medium text-slate-700">No posts yet</p>
            <p class="mt-1">This user hasn't posted anything</p>
          </div>
        } @else {
          <div class="flex-1 divide-y divide-slate-100">
            @for (post of posts(); track post.id) {
              <article class="px-6 py-4">
                <h4 class="font-bold text-slate-900 mb-1">{{ post.title }}</h4>
                <p class="text-sm text-slate-600 leading-relaxed">{{ post.previewText }}</p>
                @if (post.images.length > 0) {
                  <div class="mt-3 rounded-xl overflow-hidden"
                    [class.grid]="post.images.length > 1"
                    [class.grid-cols-2]="post.images.length > 1"
                    [class.gap-0.5]="post.images.length > 1">
                    @for (img of post.images.slice(0, 4); track img; let i = $index) {
                      <div class="relative bg-slate-100 overflow-hidden"
                        [class.aspect-video]="post.images.length === 1"
                        [class.aspect-square]="post.images.length > 1">
                        <img [src]="postImageUrl(img)" [alt]="post.title" class="w-full h-full object-cover" />
                        @if (i === 3 && post.images.length > 4) {
                          <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span class="text-white text-2xl font-bold">+{{ post.images.length - 4 }}</span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
                <div class="mt-3 flex items-center gap-4 text-sm text-slate-400">
                  <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {{ post.likeCount }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {{ post.commentCount }}
                  </span>
                </div>
              </article>
            }
          </div>
        }

        <div class="border-t border-slate-200 bg-slate-50 p-4">
          <app-pagination
            [config]="paginationConfig()"
            [isLoading]="postsLoading()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          ></app-pagination>
        </div>
      </section>
    </div>
  `
})
export class ProfileDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userFacade = inject(UserFacadeService);
  private readonly postFacade = inject(PostFacadeService);
  private readonly friendshipFacade = inject(FriendshipFacadeService);

  readonly user = signal<UserUI | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly posts = signal<PostUI[]>([]);
  readonly postsLoading = signal(false);

  readonly isFriend = signal(false);
  readonly friendshipLoading = signal(false);
  readonly hasSentRequest = signal(false);

  readonly paginationConfig = signal<PaginationConfig>({
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  });

  private readonly destroy$ = new Subject<void>();

  ngOnInit() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = parseInt(params.get('id') || '0', 10);
      if (id > 0) {
        this.loadUser(id);
        this.loadPosts(id, this.paginationConfig().currentPage, this.paginationConfig().pageSize);
        this.loadFriendshipStatus(id);
        this.loadSentStatus(id);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUser(id: number) {
    this.isLoading.set(true);
    this.error.set(null);

    this.userFacade.getById(id).subscribe({
      next: res => {
        this.user.set(res);
        this.isLoading.set(false);
      },
      error: err => {
        this.error.set(err.message || 'Failed to load profile.');
        this.isLoading.set(false);
      }
    });
  }

  loadFriendshipStatus(id: number) {
    this.friendshipLoading.set(true);
    this.friendshipFacade.isFriend(id).subscribe({
      next: res => {
        this.isFriend.set(Boolean(res));
        this.friendshipLoading.set(false);
      },
      error: () => {
        this.isFriend.set(false);
        this.friendshipLoading.set(false);
      }
    });
  }

  loadSentStatus(id: number) {
    this.hasSentRequest.set(false);
    this.friendshipFacade.getSentRequests({ page: 0, size: 50 }).subscribe({
      next: res => {
        const found = res.items.some(item => item.addresseeId === id);
        this.hasSentRequest.set(found);
      },
      error: () => {
        this.hasSentRequest.set(false);
      }
    });
  }

  loadPosts(userId: number, page: number, size: number) {
    const safePage = Math.max(0, page);
    this.postsLoading.set(true);
    this.postFacade.getByUser(userId, { page: safePage, size }).subscribe({
      next: res => {
        this.posts.set(res.items);
        this.paginationConfig.set({
          currentPage: res.currentPage,
          pageSize: res.pageSize,
          totalElements: res.totalItems,
          totalPages: res.totalPages,
          hasNext: res.currentPage < res.totalPages - 1,
          hasPrevious: res.currentPage > 0
        });
        this.postsLoading.set(false);
      },
      error: err => {
        console.error('Failed to load posts by user', err);
        this.postsLoading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    const id = this.user()?.id;
    if (id) {
      this.loadPosts(id, page, this.paginationConfig().pageSize);
    }
  }

  onPageSizeChange(size: number) {
    const id = this.user()?.id;
    if (id) {
      this.loadPosts(id, 0, size);
    }
  }

  addFriend() {
    const id = this.user()?.id;
    if (!id) return;

    this.friendshipFacade.sendRequest(id).subscribe({
      next: () => {
        this.isFriend.set(false);
        this.hasSentRequest.set(true);
      },
      error: err => {
        console.error('Failed to send friend request', err);
      }
    });
  }

  cancelRequest() {
    const id = this.user()?.id;
    if (!id) return;

    this.friendshipFacade.deleteFriendship(id).subscribe({
      next: () => {
        this.hasSentRequest.set(false);
      },
      error: err => {
        console.error('Failed to cancel friend request', err);
      }
    });
  }

  removeFriend() {
    const id = this.user()?.id;
    if (!id) return;

    this.friendshipFacade.deleteFriendship(id).subscribe({
      next: () => {
        this.isFriend.set(false);
      },
      error: err => {
        console.error('Failed to remove friend', err);
      }
    });
  }

  blockUser() {
    const id = this.user()?.id;
    if (!id) return;

    if (!confirm('Block this user?')) {
      return;
    }

    this.friendshipFacade.blockUser(id).subscribe({
      next: () => {
        this.isFriend.set(false);
        this.hasSentRequest.set(false);
      },
      error: err => {
        console.error('Failed to block user', err);
      }
    });
  }

  goBack() {
    this.router.navigateByUrl('/dashboard/client/suggestedFriends');
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
    if (!pfp) {
      return '';
    }
    if (pfp.startsWith('http://') || pfp.startsWith('https://')) {
      return pfp;
    }
    if (pfp.startsWith('/uploads/')) {
      return `http://localhost:8081${pfp}`;
    }
    return `http://localhost:8081/uploads/${pfp}`;
  }

  postImageUrl(img: string): string {
    if (!img) {
      return '';
    }
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    if (img.startsWith('/uploads/')) {
      return `http://localhost:8081${img}`;
    }
    return `http://localhost:8081/uploads/${img}`;
  }
}
