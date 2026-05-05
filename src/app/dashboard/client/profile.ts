import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserContextService } from '../../user-context.service';
import { BadgesDisplayComponent } from '../Nav/badges-display';
import { UserFacadeService } from '../../api/facades/user.facade';
import { PostFacadeService } from '../../api/facades/post.facade';
import { CommentFacadeService } from '../../api/facades/comment.facade';
import { FriendshipFacadeService } from '../../api/facades/friendship.facade';
import { PostUI } from '../../api/facades/models/post.model';
import { CommentUI } from '../../api/facades/models/comment.model';
import { UserSummaryUI } from '../../api/facades/models/friendship.model';
import { PaginationComponent, PaginationConfig } from '../../shared/pagination/pagination.component';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const COMMENT_PAGE_SIZE = 5;

interface CommentState {
  items: CommentUI[];
  page: number;
  hasMore: boolean;
  loading: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgesDisplayComponent, PaginationComponent],
  template: `
    <article class="relative rounded-3xl overflow-hidden bg-white shadow-sm ring-1 ring-indigo-500/10 w-full">

      <!-- Banner -->
      <div
        class="relative h-44 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500 overflow-hidden cursor-pointer group"
        (click)="openModal()"
      >
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
              <div class="relative w-28 h-28 flex-shrink-0 cursor-pointer group/avatar" (click)="openModal()">
                <div class="absolute -inset-[3px] rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 z-0"></div>
                <div class="absolute -inset-[3px] rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 blur-md opacity-50 z-[-1]"></div>
                <div class="relative z-10 w-full h-full rounded-[1.1rem] overflow-hidden bg-indigo-100">
                  <div class="absolute inset-0 z-20 flex items-center justify-center bg-black/0 group-hover/avatar:bg-black/40 transition-all duration-200 rounded-[1.1rem]">
                    <span class="text-2xl opacity-0 group-hover/avatar:opacity-100 transition-all duration-200">📷</span>
                  </div>
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

        <!-- Badges -->
        <div class="h-px bg-gradient-to-r from-indigo-100 via-purple-100 to-transparent my-5"></div>
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
              <div class="flex items-center gap-3 p-3 rounded-xl bg-white ring-1 ring-slate-100">
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
              <article class="p-5 transition-colors hover:bg-slate-50 bg-white">

                <!-- Top row: badge + time + actions -->
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    @if (post.communityTitle && post.communityTitle !== 'General') {
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.65rem] font-semibold bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        c/{{ post.communityTitle }}
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.65rem] font-semibold bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Personal
                      </span>
                    }
                    <span class="text-xs text-slate-400">{{ getTimeAgo(post.createdAt) }}</span>
                    @if (post.status === 'Pending') {
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-amber-50 text-amber-600 ring-1 ring-amber-200">Pending</span>
                    }
                  </div>

                  <!-- Edit / Delete -->
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button (click)="startEdit(post)" class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit post">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button (click)="deletePost(post.id)" [disabled]="deletingIds().has(post.id)" class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40" title="Delete post">
                      @if (deletingIds().has(post.id)) {
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                      } @else {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      }
                    </button>
                  </div>
                </div>

                <!-- Edit form -->
                @if (editingPostId() === post.id) {
                  <div class="mb-3 p-4 bg-indigo-50 rounded-xl ring-1 ring-indigo-200">
                    <input
                      type="text"
                      [(ngModel)]="editTitle"
                      placeholder="Title"
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2 bg-white"
                    />
                    <textarea
                      [(ngModel)]="editContent"
                      placeholder="Content"
                      rows="3"
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white mb-2"
                    ></textarea>

                    <!-- Image previews -->
                    @if (editPreviews().length > 0) {
                      <div class="grid grid-cols-3 gap-2 mb-2">
                        @for (preview of editPreviews(); track preview; let i = $index) {
                          <div class="relative rounded-lg overflow-hidden aspect-square bg-slate-100">
                            <img [src]="preview" class="w-full h-full object-cover" />
                            <button type="button" (click)="removeEditImage(i)" class="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        }
                      </div>
                    }

                    <!-- Add images -->
                    @if (editImages().length < 5) {
                      <label class="cursor-pointer inline-block mb-2">
                        <div class="flex items-center gap-2 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-xs">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Add images {{ editImages().length > 0 ? '(' + editImages().length + '/5)' : '' }}
                        </div>
                        <input type="file" accept="image/*" multiple class="hidden" (change)="addEditImages($event)" />
                      </label>
                    }

                    <div class="flex gap-2">
                      <button (click)="saveEdit(post.id)" [disabled]="savingEdit()" class="px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        {{ savingEdit() ? 'Saving...' : 'Save' }}
                      </button>
                      <button (click)="cancelEdit()" class="px-4 py-1.5 bg-white text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors border border-slate-200">
                        Cancel
                      </button>
                    </div>
                  </div>
                }

                <h4 class="font-bold text-slate-900 mb-1">{{ post.title }}</h4>
                <p class="text-sm text-slate-600 leading-relaxed">{{ post.previewText }}</p>

                <!-- Existing images -->
@if (editExistingImages().length > 0) {
  <p class="text-xs font-semibold text-slate-500 mb-1">Current images</p>
  <div class="grid grid-cols-3 gap-2 mb-2">
    @for (img of editExistingImages(); track img; let i = $index) {
      <div class="relative rounded-lg overflow-hidden aspect-square bg-slate-100">
        <img [src]="uploadUrl(img)" class="w-full h-full object-cover" />
        <button
          type="button"
          (click)="removeExistingImage(i)"
          class="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    }
  </div>
}

<!-- New image previews -->
@if (editPreviews().length > 0) {
  <p class="text-xs font-semibold text-slate-500 mb-1">New images</p>
  <div class="grid grid-cols-3 gap-2 mb-2">
    @for (preview of editPreviews(); track preview; let i = $index) {
      <div class="relative rounded-lg overflow-hidden aspect-square bg-slate-100">
        <img [src]="preview" class="w-full h-full object-cover" />
        <button
          type="button"
          (click)="removeEditImage(i)"
          class="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    }
  </div>
}

<!-- Add images button -->
@if (editExistingImages().length + editImages().length < 5) {
  <label class="cursor-pointer inline-block mb-2">
    <div class="flex items-center gap-2 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-xs">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      Add images {{ (editExistingImages().length + editImages().length) > 0 ? '(' + (editExistingImages().length + editImages().length) + '/5)' : '' }}
    </div>
    <input type="file" accept="image/*" multiple class="hidden" (change)="addEditImages($event)" />
  </label>
}
                

                <!-- Like + Comment buttons -->
                <div class="mt-3 flex items-center gap-3">
                  <button
                    (click)="toggleLike(post)"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    [class.text-rose-600]="post.isLiked"
                    [class.bg-rose-50]="post.isLiked"
                    [class.text-slate-500]="!post.isLiked"
                    [class.hover:bg-slate-100]="!post.isLiked"
                  >
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
                    [class.text-slate-500]="!expandedPosts().has(post.id)"
                    [class.hover:bg-slate-100]="!expandedPosts().has(post.id)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {{ post.commentCount }}
                  </button>
                </div>

                <!-- Comments section -->
                @if (expandedPosts().has(post.id)) {
                  <div class="mt-4 border-t border-slate-100 pt-4">
                    @if (commentsLoadingFor(post.id)) {
                      <div class="flex items-center gap-2 text-sm text-slate-500 py-2">
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        Loading comments...
                      </div>
                    } @else {
                      @let postComments = getComments(post.id);
                      @if (postComments.length === 0) {
                        <p class="text-sm text-slate-400 text-center py-2 mb-3">No comments yet. Be the first!</p>
                      }
                      @for (comment of postComments; track comment.id) {
                        <div class="flex items-start gap-2 mb-3">
                          @if (comment.authorPfp) {
                            <img [src]="uploadUrl(comment.authorPfp)" class="w-7 h-7 rounded-full object-cover flex-shrink-0" />
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
                                  @if (isOwnComment(comment.userId)) {
                                    <button (click)="deleteComment(post.id, comment.id)" class="text-xs text-red-400 hover:text-red-600 transition-colors" title="Delete comment">
                                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  }
                                </div>
                              </div>
                              <p class="text-slate-700">{{ comment.content }}</p>
                            </div>
                          </div>
                        </div>
                      }

                      @if (commentHasMore(post.id)) {
                        <div class="text-center mt-2 mb-3">
                          <button (click)="loadMoreComments(post.id)" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Load more comments</button>
                        </div>
                      }

                      <div class="flex items-center gap-2 mt-3">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          [value]="getCommentInput(post.id)"
                          (input)="setCommentInput(post.id, $any($event.target).value)"
                          (keyup.enter)="submitComment(post.id)"
                          class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                        <button
                          (click)="submitComment(post.id)"
                          [disabled]="!getCommentInput(post.id).trim() || submittingComments().has(post.id)"
                          class="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center min-w-[52px]"
                        >
                          @if (submittingComments().has(post.id)) {
                            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
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
  private readonly commentFacade    = inject(CommentFacadeService);
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
  readonly posts              = signal<PostUI[]>([]);
  readonly postsLoading       = signal(true);
  readonly deletingIds        = signal<Set<number>>(new Set());
  readonly expandedPosts      = signal<Set<number>>(new Set());
  readonly commentInputs      = signal<Map<number, string>>(new Map());
  readonly submittingComments = signal<Set<number>>(new Set());
  private readonly commentStates = signal<Map<number, CommentState>>(new Map());

  // ── Edit ──
  readonly editingPostId = signal<number | null>(null);
  readonly savingEdit    = signal(false);
  readonly editImages    = signal<File[]>([]);
  readonly editPreviews  = signal<string[]>([]);
  readonly editExistingImages = signal<string[]>([]);
  editTitle   = '';
  editContent = '';

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

  async toggleLike(post: PostUI) {
    try {
      await firstValueFrom(this.postFacade.toggleLike(post.id));
      this.posts.update(list => list.map(p =>
        p.id === post.id
          ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) }
          : p
      ));
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  }

  async deletePost(postId: number) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    this.deletingIds.update(s => new Set(s).add(postId));
    try {
      await firstValueFrom(this.postFacade.delete(postId));
      this.posts.update(list => list.filter(p => p.id !== postId));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete post');
    } finally {
      this.deletingIds.update(s => { const n = new Set(s); n.delete(postId); return n; });
    }
  }

 startEdit(post: PostUI) {
  this.editingPostId.set(post.id);
  this.editTitle   = post.title;
  this.editContent = post.content;
  this.editImages.set([]);
  this.editPreviews.set([]);
  this.editExistingImages.set([...post.images]);
}

cancelEdit() {
  this.editingPostId.set(null);
  this.editTitle   = '';
  this.editContent = '';
  this.editImages.set([]);
  this.editPreviews.set([]);
  this.editExistingImages.set([]);
}

  async saveEdit(postId: number) {
  if (!this.editTitle.trim() || !this.editContent.trim()) return;
  this.savingEdit.set(true);
  try {
    const updated = await firstValueFrom(this.postFacade.update(postId, {
      title:   this.editTitle.trim(),
      content: this.editContent.trim(),
      imgs:    this.editImages().length > 0 ? this.editImages() : undefined
    }));
    this.posts.update(list => list.map(p =>
      p.id === postId
        ? { ...p, ...updated, images: [...this.editExistingImages(), ...updated.images] }
        : p
    ));
    this.cancelEdit();
  } catch (err: any) {
    alert(err?.message || 'Failed to update post');
  } finally {
    this.savingEdit.set(false);
  }
}
  removeExistingImage(index: number): void {
  this.editExistingImages.update(imgs => imgs.filter((_, i) => i !== index));
}

  addEditImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const remaining = 5 - this.editImages().length;
    const newFiles = Array.from(input.files).slice(0, remaining);
    this.editImages.update(existing => [...existing, ...newFiles]);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => this.editPreviews.update(p => [...p, e.target!.result as string]);
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeEditImage(index: number): void {
    this.editImages.update(imgs => imgs.filter((_, i) => i !== index));
    this.editPreviews.update(previews => previews.filter((_, i) => i !== index));
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  getComments(postId: number): CommentUI[] { return this.commentStates().get(postId)?.items ?? []; }
  commentsLoadingFor(postId: number): boolean { return this.commentStates().get(postId)?.loading ?? false; }
  commentHasMore(postId: number): boolean { return this.commentStates().get(postId)?.hasMore ?? false; }
  getCommentInput(postId: number): string { return this.commentInputs().get(postId) ?? ''; }
  setCommentInput(postId: number, value: string): void { this.commentInputs.update(m => new Map(m).set(postId, value)); }

  toggleComments(postId: number): void {
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

  async loadComments(postId: number): Promise<void> {
    this.commentStates.update(m => new Map(m).set(postId, { items: [], page: 0, hasMore: false, loading: true }));
    try {
      const result = await firstValueFrom(this.commentFacade.getByPostPaged(postId, 0, COMMENT_PAGE_SIZE));
      this.commentStates.update(m => new Map(m).set(postId, {
        items: result.items, page: 0,
        hasMore: result.totalItems > result.items.length, loading: false
      }));
    } catch (err) {
      console.error('Failed to load comments:', err);
      this.commentStates.update(m => new Map(m).set(postId, { items: [], page: 0, hasMore: false, loading: false }));
    }
  }

  async loadMoreComments(postId: number): Promise<void> {
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
    } catch (err) {
      console.error('Failed to load more comments:', err);
      this.commentStates.update(m => new Map(m).set(postId, { ...state, loading: false }));
    }
  }

  async submitComment(postId: number): Promise<void> {
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
      this.posts.update(list => list.map(p =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p
      ));
      this.commentInputs.update(m => { const n = new Map(m); n.delete(postId); return n; });
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      this.submittingComments.update(s => { const n = new Set(s); n.delete(postId); return n; });
    }
  }

  async deleteComment(postId: number, commentId: number): Promise<void> {
    try {
      await firstValueFrom(this.commentFacade.delete(commentId));
      const state = this.commentStates().get(postId);
      if (state) {
        this.commentStates.update(m => new Map(m).set(postId, {
          ...state, items: state.items.filter(c => c.id !== commentId)
        }));
      }
      this.posts.update(list => list.map(p =>
        p.id === postId ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p
      ));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  }

  isOwnComment(commentUserId: number | undefined): boolean {
    const user = this.userContext.user();
    return !!user && !!commentUserId && user.id === commentUserId;
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
  readonly xpPercent = computed(() => Math.min(100, (this.xp() % 5000) / 50));

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

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
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
