import { Component, inject, OnDestroy, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { UserFacadeService } from '../../../api/facades/user.facade';
import { PostFacadeService } from '../../../api/facades/post.facade';
import { FriendshipFacadeService } from '../../../api/facades/friendship.facade';
import { CommentFacadeService } from '../../../api/facades/comment.facade';
import { UserUI } from '../../../api/facades/models/user.model';
import { PostUI } from '../../../api/facades/models/post.model';
import { CommentUI } from '../../../api/facades/models/comment.model';
import { PaginationComponent, PaginationConfig } from '../../../shared/pagination/pagination.component';
import { ReportModalComponent } from '../../../api/facades/models/report.model';
import { MentionInputComponent } from '../../../shared/components/mention-input';
import { MentionTextComponent } from '../../../shared/components/mention-text';
import { UserContextService } from '../../../services/user-context.service';

const COMMENT_PAGE_SIZE = 5;

interface CommentState {
  items: CommentUI[];
  page: number;
  hasMore: boolean;
  loading: boolean;
}

@Component({
  selector: 'app-profile-detail',
  standalone: true,
  imports: [CommonModule, PaginationComponent, ReportModalComponent, MentionInputComponent, MentionTextComponent],
  template: `
    <app-report-modal #reportModal (reported)="onReported()" />

    <div class="flex flex-col gap-6 pb-10">
      <div class="flex items-center gap-3">
        <button class="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" (click)="goBack()">
          Back
        </button>
        <h2 class="text-2xl font-bold text-slate-900">Profile</h2>
      </div>

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

      <!-- Posts -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[420px]">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Posts</h3>
          <span class="text-xs text-slate-400">{{ paginationConfig().totalElements }} post{{ paginationConfig().totalElements !== 1 ? 's' : '' }}</span>
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
              <article class="px-6 py-4 hover:bg-slate-50/40 transition-colors">

                <!-- Post header -->
                <div class="flex items-start justify-between gap-2 mb-2">
                  <h4 class="font-bold text-slate-900">{{ post.title }}</h4>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="text-xs text-slate-400">{{ getTimeAgo(post.createdAt) }}</span>
                    <button
                      (click)="openReportPost(post)"
                      [disabled]="post.isReportedByCurrentUser"
                      class="p-1 rounded-md transition-colors"
                      [class.text-amber-500]="post.isReportedByCurrentUser"
                      [class.text-slate-300]="!post.isReportedByCurrentUser"
                      [title]="post.isReportedByCurrentUser ? 'Already reported' : 'Report post'">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <p class="text-sm text-slate-600 leading-relaxed mb-3">{{ post.previewText }}</p>

                <!-- Post images -->
                @if (post.images.length > 0) {
                  <div class="mb-3 rounded-xl overflow-hidden"
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

                <!-- Post actions -->
                <div class="flex items-center gap-2 mb-2">
                  <button
                    (click)="toggleLike(post)"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    [class.text-rose-600]="post.isLiked"
                    [class.bg-rose-50]="post.isLiked"
                    [class.text-slate-600]="!post.isLiked"
                    [class.hover:bg-slate-100]="!post.isLiked">
                    <svg class="w-4 h-4" [attr.fill]="post.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {{ post.likeCount }}
                  </button>

                  <button
                    (click)="toggleComments(post.id)"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    [class.text-indigo-600]="expandedPosts().has(post.id)"
                    [class.bg-indigo-50]="expandedPosts().has(post.id)"
                    [class.text-slate-600]="!expandedPosts().has(post.id)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {{ post.commentCount }}
                  </button>
                </div>

                <!-- Comments section -->
                @if (expandedPosts().has(post.id)) {
                  <div class="border-t border-slate-100 pt-3 mt-1">

                    @if (commentsLoadingFor(post.id)) {
                      <div class="flex items-center gap-2 text-sm text-slate-500 py-2">
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Loading comments...
                      </div>
                    } @else {
                      @if (getComments(post.id).length === 0) {
                        <p class="text-sm text-slate-400 text-center py-2 mb-3">No comments yet.</p>
                      }

                      @for (comment of getComments(post.id); track comment.id) {
                        <div class="flex items-start gap-2 mb-3">
                          @if (comment.authorPfp) {
                            <img [src]="'http://localhost:8081/uploads/' + comment.authorPfp" class="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                          } @else {
                            <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0 select-none">
                              {{ getInitials(comment.authorFullName ?? '?') }}
                            </div>
                          }
                          <div class="flex-1">
                            <div class="bg-white rounded-xl px-3 py-2 text-sm border border-slate-100 shadow-sm">
                              <div class="flex items-center justify-between gap-2 mb-0.5">
                                <p class="font-semibold text-slate-800 text-xs">{{ comment.authorFullName }}</p>
                                <div class="flex items-center gap-2">
                                  @if (comment.createdAt) {
                                    <span class="text-xs text-slate-400">{{ getTimeAgo(comment.createdAt) }}</span>
                                  }
                                  <!-- Like comment -->
                                  <button
                                    (click)="toggleCommentLike(comment)"
                                    class="flex items-center gap-1 text-xs transition-colors"
                                    [class.text-rose-600]="comment.isLiked"
                                    [class.text-slate-400]="!comment.isLiked">
                                    <svg class="w-3.5 h-3.5" [attr.fill]="comment.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    {{ comment.likeCount ?? 0 }}
                                  </button>
                                  <!-- Report comment -->
                                  @if (!isOwnComment(comment.userId)) {
                                    <button
                                      (click)="openReportComment(comment)"
                                      [disabled]="comment.isReportedByCurrentUser"
                                      class="transition-colors"
                                      [class.text-amber-500]="comment.isReportedByCurrentUser"
                                      [class.text-slate-300]="!comment.isReportedByCurrentUser"
                                      [title]="comment.isReportedByCurrentUser ? 'Already reported' : 'Report comment'">
                                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                                      </svg>
                                    </button>
                                  }
                                  <!-- Delete own comment -->
                                  @if (isOwnComment(comment.userId)) {
                                    <button (click)="deleteComment(post.id, comment.id)" class="text-xs text-red-400 hover:text-red-600 transition-colors" title="Delete comment">
                                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  }
                                </div>
                              </div>
                              <app-mention-text class="text-slate-700" [text]="comment.content" />

                              <button (click)="toggleReplies(comment.id)" class="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-1">
                                @if (expandedComments().has(comment.id)) { Hide replies } @else { View replies }
                              </button>
                            </div>

                            <!-- Replies -->
                            @if (expandedComments().has(comment.id)) {
                              <div class="ml-4 mt-2 border-l-2 border-slate-200 pl-3 space-y-2">
                                @if (repliesLoading().has(comment.id)) {
                                  <p class="text-xs text-slate-400 py-1">Loading replies...</p>
                                }
                                @for (reply of getReplies(comment.id); track reply.id) {
                                  <div class="flex items-start gap-2">
                                    @if (reply.authorPfp) {
                                      <img [src]="'http://localhost:8081/uploads/' + reply.authorPfp" class="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                    } @else {
                                      <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                        {{ getInitials(reply.authorFullName ?? '?') }}
                                      </div>
                                    }
                                    <div class="flex-1 bg-white rounded-lg px-2 py-1.5 text-xs border border-slate-100 shadow-sm">
                                      <div class="flex items-center justify-between mb-0.5">
                                        <span class="font-semibold text-slate-800">{{ reply.authorFullName }}</span>
                                        <div class="flex items-center gap-1.5">
                                          @if (reply.createdAt) {
                                            <span class="text-slate-400">{{ getTimeAgo(reply.createdAt) }}</span>
                                          }
                                          <button
                                            (click)="toggleCommentLike(reply)"
                                            class="flex items-center gap-0.5 transition-colors"
                                            [class.text-rose-500]="reply.isLiked"
                                            [class.text-slate-400]="!reply.isLiked">
                                            <svg class="w-3 h-3" [attr.fill]="reply.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            {{ reply.likeCount ?? 0 }}
                                          </button>
                                          @if (isOwnComment(reply.userId)) {
                                            <button (click)="deleteReply(comment.id, reply.id)" class="text-red-400 hover:text-red-600 transition-colors">
                                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                            </button>
                                          }
                                        </div>
                                      </div>
                                      <app-mention-text class="text-slate-700" [text]="reply.content" />
                                    </div>
                                  </div>
                                }
                                <!-- Reply input -->
                                <div class="flex items-center gap-2 mt-1">
                                  <app-mention-input
                                    class="flex-1"
                                    [value]="getReplyInput(comment.id)"
                                    (valueChange)="setReplyInput(comment.id, $any($event))"
                                    placeholder="Write a reply..."/>
                                  <button (click)="submitReply(comment.id)" class="text-xs px-2 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                    Send
                                  </button>
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      }

                      @if (commentHasMore(post.id)) {
                        <div class="text-center mt-2 mb-3">
                          <button (click)="loadMoreComments(post.id)" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Load more comments</button>
                        </div>
                      }

                      <!-- Comment input -->
                      <div class="flex items-center gap-2 mt-3">
                        <app-mention-input
                          class="flex-1"
                          [value]="getCommentInput(post.id)"
                          (valueChange)="setCommentInput(post.id, $any($event))"
                          placeholder="Write a comment..."/>
                        <button
                          (click)="submitComment(post.id)"
                          [disabled]="!getCommentInput(post.id).trim() || submittingComments().has(post.id)"
                          class="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center min-w-[52px]">
                          @if (submittingComments().has(post.id)) {
                            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                          } @else { Post }
                        </button>
                      </div>
                    }
                  </div>
                }
              </article>
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
  @ViewChild('reportModal') reportModal!: ReportModalComponent;

  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly userFacade     = inject(UserFacadeService);
  private readonly postFacade     = inject(PostFacadeService);
  private readonly friendshipFacade = inject(FriendshipFacadeService);
  private readonly commentFacade  = inject(CommentFacadeService);
  private readonly userContext    = inject(UserContextService);

  readonly user            = signal<UserUI | null>(null);
  readonly isLoading       = signal(false);
  readonly error           = signal<string | null>(null);
  readonly posts           = signal<PostUI[]>([]);
  readonly postsLoading    = signal(false);
  readonly isFriend        = signal(false);
  readonly friendshipLoading = signal(false);
  readonly hasSentRequest  = signal(false);
  readonly isBlocked       = signal(false);
  readonly blockConfirm    = signal(false);

  // Comments
  private readonly commentStates   = signal<Map<number, CommentState>>(new Map());
  private readonly commentInputs   = signal<Map<number, string>>(new Map());
  private readonly replyInputs     = signal<Map<number, string>>(new Map());
  private readonly repliesMap      = signal<Map<number, CommentUI[]>>(new Map());
  readonly repliesLoading          = signal<Set<number>>(new Set());
  readonly expandedPosts           = signal<Set<number>>(new Set());
  readonly expandedComments        = signal<Set<number>>(new Set());
  readonly submittingComments      = signal<Set<number>>(new Set());

  readonly paginationConfig = signal<PaginationConfig>({
    totalPages: 0, totalElements: 0, currentPage: 0,
    pageSize: 10, hasNext: false, hasPrevious: false
  });

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

  toggleLike(post: PostUI) {
    this.postFacade.toggleLike(post.id).subscribe({
      next: () => {
        this.posts.update(list => list.map(p =>
          p.id === post.id
            ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }
            : p
        ));
      }
    });
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
      next: res => this.hasSentRequest.set(res.items.some(item => item.addresseeId === id)),
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
      next: res => this.isBlocked.set(res.items.some(u => u.id === profileUserId)),
      error: () => {}
    });
  }

  // ── COMMENTS ─────────────────────────────────────────────────────────────

  getComments(postId: number): CommentUI[] { return this.commentStates().get(postId)?.items ?? []; }
  commentsLoadingFor(postId: number): boolean { return this.commentStates().get(postId)?.loading ?? false; }
  commentHasMore(postId: number): boolean { return this.commentStates().get(postId)?.hasMore ?? false; }
  getCommentInput(postId: number): string { return this.commentInputs().get(postId) ?? ''; }
  setCommentInput(postId: number, value: string) { this.commentInputs.update(m => new Map(m).set(postId, value)); }
  getReplyInput(commentId: number): string { return this.replyInputs().get(commentId) ?? ''; }
  setReplyInput(commentId: number, value: string) { this.replyInputs.update(m => new Map(m).set(commentId, value)); }
  getReplies(commentId: number): CommentUI[] { return this.repliesMap().get(commentId) ?? []; }

  toggleComments(postId: number) {
    this.expandedPosts.update(set => {
      const next = new Set(set);
      if (next.has(postId)) {
        next.delete(postId);
        this.commentStates.update(m => { const n = new Map(m); n.delete(postId); return n; });
      } else {
        next.add(postId);
        this.loadComments(postId);
      }
      return next;
    });
  }

  async loadComments(postId: number) {
    this.commentStates.update(m => new Map(m).set(postId, { items: [], page: 0, hasMore: false, loading: true }));
    try {
      const result = await firstValueFrom(this.commentFacade.getByPostPaged(postId, 0, COMMENT_PAGE_SIZE));
      this.commentStates.update(m => new Map(m).set(postId, {
        items: result.items, page: 0,
        hasMore: result.totalItems > result.items.length, loading: false
      }));
    } catch {
      this.commentStates.update(m => new Map(m).set(postId, { items: [], page: 0, hasMore: false, loading: false }));
    }
  }

  async loadMoreComments(postId: number) {
    const state = this.commentStates().get(postId);
    if (!state || state.loading || !state.hasMore) return;
    this.commentStates.update(m => new Map(m).set(postId, { ...state, loading: true }));
    try {
      const nextPage = state.page + 1;
      const result = await firstValueFrom(this.commentFacade.getByPostPaged(postId, nextPage, COMMENT_PAGE_SIZE));
      const existingIds = new Set(state.items.map(c => c.id));
      const newItems = result.items.filter(c => !existingIds.has(c.id));
      this.commentStates.update(m => new Map(m).set(postId, {
        items: [...state.items, ...newItems], page: nextPage,
        hasMore: state.items.length + newItems.length < result.totalItems, loading: false
      }));
    } catch {
      this.commentStates.update(m => new Map(m).set(postId, { ...state, loading: false }));
    }
  }

  async submitComment(postId: number) {
    const content = this.getCommentInput(postId).trim();
    if (!content) return;
    this.submittingComments.update(s => new Set(s).add(postId));
    try {
      const comment = await firstValueFrom(this.commentFacade.create({ content, postId }));
      const state = this.commentStates().get(postId);
      this.commentStates.update(m => new Map(m).set(postId, {
        ...(state ?? { page: 0, hasMore: false, loading: false }),
        items: [...(state?.items ?? []), comment]
      }));
      this.posts.update(list => list.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
      this.commentInputs.update(m => { const n = new Map(m); n.delete(postId); return n; });
    } finally {
      this.submittingComments.update(s => { const n = new Set(s); n.delete(postId); return n; });
    }
  }

  async deleteComment(postId: number, commentId: number) {
    try {
      await firstValueFrom(this.commentFacade.delete(commentId));
      const state = this.commentStates().get(postId);
      if (state) this.commentStates.update(m => new Map(m).set(postId, { ...state, items: state.items.filter(c => c.id !== commentId) }));
      this.posts.update(list => list.map(p => p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p));
    } catch (err) { console.error(err); }
  }

  toggleCommentLike(comment: CommentUI) {
    this.commentFacade.toggleLike(comment.id).subscribe({
      next: () => {
        const updater = (items: CommentUI[]) => items.map(c =>
          c.id === comment.id
            ? { ...c, isLiked: !c.isLiked, likeCount: (c.likeCount ?? 0) + (c.isLiked ? -1 : 1) }
            : c
        );
        // update in comment states
        this.commentStates.update(states => {
          const next = new Map(states);
          next.forEach((state, postId) => {
            next.set(postId, { ...state, items: updater(state.items) });
          });
          return next;
        });
        // update in replies
        this.repliesMap.update(map => {
          const next = new Map(map);
          next.forEach((replies, commentId) => {
            next.set(commentId, updater(replies));
          });
          return next;
        });
      }
    });
  }

  // ── REPLIES ───────────────────────────────────────────────────────────────

  toggleReplies(commentId: number) {
    this.expandedComments.update(set => {
      const next = new Set(set);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
        if (!this.repliesMap().has(commentId)) this.loadReplies(commentId);
      }
      return next;
    });
  }

  async loadReplies(commentId: number) {
    this.repliesLoading.update(s => new Set(s).add(commentId));
    try {
      const result = await firstValueFrom(this.commentFacade.getReplies(commentId, 0, 10));
      this.repliesMap.update(m => new Map(m).set(commentId, result.items));
    } finally {
      this.repliesLoading.update(s => { const n = new Set(s); n.delete(commentId); return n; });
    }
  }

  async submitReply(commentId: number) {
    const content = this.getReplyInput(commentId).trim();
    if (!content) return;
    try {
      const reply = await firstValueFrom(this.commentFacade.createReply(commentId, { content }));
      this.repliesMap.update(m => new Map(m).set(commentId, [...(m.get(commentId) ?? []), reply]));
      this.replyInputs.update(m => { const n = new Map(m); n.delete(commentId); return n; });
    } catch (err) { console.error(err); }
  }

  async deleteReply(commentId: number, replyId: number) {
    try {
      await firstValueFrom(this.commentFacade.delete(replyId));
      this.repliesMap.update(m => new Map(m).set(commentId, (m.get(commentId) ?? []).filter(r => r.id !== replyId)));
    } catch (err) { console.error(err); }
  }

  // ── REPORT ────────────────────────────────────────────────────────────────

  openReportPost(post: PostUI) {
    if (post.isReportedByCurrentUser) return;
    this.reportModal.open('POST', post.id);
  }

  openReportComment(comment: CommentUI) {
    if (comment.isReportedByCurrentUser) return;
    this.reportModal.open('COMMENT', comment.id);
  }

  onReported() {
    const id = this.user()?.id;
    if (id) this.loadPosts(id, this.paginationConfig().currentPage, this.paginationConfig().pageSize);
  }

  isOwnComment(commentUserId: number | undefined): boolean {
    const user = this.userContext.user();
    return !!user && !!commentUserId && user.id === commentUserId;
  }

  // ── UTILS ─────────────────────────────────────────────────────────────────

  goBack() { this.router.navigateByUrl('/dashboard/client/suggestedFriends'); }

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

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
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

  postImageUrl(img: string): string {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    if (img.startsWith('/uploads/')) return `http://localhost:8081${img}`;
    return `http://localhost:8081/uploads/${img}`;
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