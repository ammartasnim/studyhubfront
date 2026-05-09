import {
  Component, ViewChild, OnInit, OnDestroy, inject, signal, computed, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatePostModalComponent } from '../create-post';
import { CreateCommunityModalComponent } from '../create-community';
import { FeedService } from '../../../services/feed.service';
import { CommentUI, PostFacadeService, PostUI } from '../../../api/facades';
import { ReportModalComponent } from '../../../api/facades/models/report.model';
import { MentionInputComponent } from '../../../shared/components/mention-input';
import { MentionTextComponent } from '../../../shared/components/mention-text';

@Component({
  selector: 'app-academic-feed',
  standalone: true,
  imports: [CommonModule, CreatePostModalComponent, CreateCommunityModalComponent, ReportModalComponent,MentionInputComponent,MentionTextComponent],
  template: `
    <app-create-post-modal #createPostModal (postCreated)="onPostCreated()" />
    <app-create-community-modal #createCommunityModal (communityCreated)="onCommunityCreated()" />
    <app-report-modal #reportModal (reported)="onReported()" />

    <div class="flex flex-col gap-5">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex-1">
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search posts..."
              aria-label="Search feed"
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value)"
              class="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        <div class="flex gap-2">
          @if (feedService.hasCommunities()) {
            <button
              (click)="openCreatePost()"
              class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Post
            </button>
          }
          <button
            (click)="openCreateCommunity()"
            class="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            New Community
          </button>
        </div>
      </div>

      <!-- Feed Section -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
          <h2 class="text-xl font-bold text-slate-900">Academic Feed</h2>
        </div>

        @if (feedService.isLoading()) {
          <div class="p-6 flex flex-col gap-4">
            @for (i of [1, 2, 3]; track i) {
              <div class="animate-pulse rounded-xl border border-slate-100 p-5">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div class="flex-1">
                    <div class="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                    <div class="h-3 bg-slate-100 rounded w-24"></div>
                  </div>
                </div>
                <div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-slate-100 rounded w-full mb-1"></div>
                <div class="h-3 bg-slate-100 rounded w-5/6"></div>
              </div>
            }
          </div>
        }

        @else if (feedService.error()) {
          <div class="px-6 py-10 text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p class="font-medium text-slate-700">Failed to load feed</p>
            <p class="text-sm text-slate-500 mt-1">{{ feedService.error() }}</p>
            <button (click)="feedService.loadFeed()" class="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              Try again
            </button>
          </div>
        }

        @else if (filteredPosts().length === 0) {
          <div class="px-6 py-10 text-center text-slate-500">
            @if (searchQuery()) {
              <p class="text-lg font-medium text-slate-700">No results for "{{ searchQuery() }}"</p>
              <p class="mt-2 text-sm">Try a different search term.</p>
            } @else {
              <p class="text-lg font-medium text-slate-700">Nothing in your feed yet</p>
              <p class="mt-2 text-sm">Join communities to see posts here, or be the first to share something!</p>
              @if (feedService.hasCommunities()) {
                <button (click)="openCreatePost()" class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create First Post
                </button>
              }
            }
          </div>
        }

        @else {
          <div class="divide-y divide-slate-100">
            @for (post of filteredPosts(); track post.id) {
              <article class="bg-white transition-colors hover:bg-slate-50/40">

                <!-- Post header -->
                <div class="flex items-start gap-3 px-6 pt-5 pb-3">
                  @if (post.authorPfp) {
                    <img [src]="'http://localhost:8081/uploads/' + post.authorPfp" [alt]="post.authorFullName" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  } @else {
                    <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0 select-none">
                      {{ getInitials(post.authorFullName) }}
                    </div>
                  }
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <p class="font-semibold text-slate-900 text-sm">{{ post.authorFullName }}</p>
                      <div class="flex items-center gap-2 flex-shrink-0">
                        <span class="text-xs text-slate-400 pt-0.5">{{ getTimeAgo(post.createdAt) }}</span>
                        <!-- Report button -->
                        <button
                          (click)="openReportPost(post)"
                          [disabled]="post.isReportedByCurrentUser"
                          class="p-1 rounded-md transition-colors"
                          [class.text-amber-500]="post.isReportedByCurrentUser"
                          [class.text-slate-300]="!post.isReportedByCurrentUser"
                          [class.hover:text-red-400]="!post.isReportedByCurrentUser"
                          [title]="post.isReportedByCurrentUser ? 'Already reported' : 'Report post'"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div class="flex items-center gap-1 mt-0.5">
                      <span class="text-xs text-slate-400">in</span>
                      <span class="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{{ post.communityTitle }}</span>
                    </div>
                  </div>
                </div>

                <!-- Post content -->
                <div class="px-6 pb-3">
                  <h3 class="font-bold text-slate-900 mb-1">{{ post.title }}</h3>
                  <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{{ post.content }}</p>
                </div>

                <!-- Post images -->
                @if (post.images.length > 0) {
                  <div class="px-6 pb-3">
                    <div class="rounded-xl overflow-hidden" [class.grid]="post.images.length > 1" [class.grid-cols-2]="post.images.length > 1" [class.gap-0.5]="post.images.length > 1">
                      @for (img of post.images.slice(0, 4); track img; let i = $index) {
                        <div class="relative bg-slate-100 overflow-hidden" [class.aspect-video]="post.images.length === 1" [class.aspect-square]="post.images.length > 1">
                          <img [src]="'http://localhost:8081/uploads/' + img" [alt]="post.title" class="w-full h-full object-cover" />
                          @if (i === 3 && post.images.length > 4) {
                            <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span class="text-white text-2xl font-bold">+{{ post.images.length - 4 }}</span>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Post actions -->
                <div class="px-6 pb-4 flex items-center gap-2">
                  <button
                    (click)="feedService.toggleLike(post.id)"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    [class.text-rose-600]="post.isLiked"
                    [class.bg-rose-50]="post.isLiked"
                    [class.text-slate-600]="!post.isLiked"
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
                    [class.text-slate-600]="!expandedPosts().has(post.id)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {{ post.commentCount }}
                  </button>
                </div>

                <!-- Comments section -->
                @if (expandedPosts().has(post.id)) {
                  <div class="border-t border-slate-100 bg-slate-50/80 px-6 py-4">

                    @if (feedService.commentsLoading().has(post.id)) {
                      <div class="flex items-center gap-2 text-sm text-slate-500 py-2">
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Loading comments...
                      </div>
                    } @else {
                      @let postComments = feedService.comments().get(post.id) ?? [];

                      @if (postComments.length === 0) {
                        <p class="text-sm text-slate-400 text-center py-2 mb-3">No comments yet. Be the first!</p>
                      }

                      @for (comment of postComments; track comment.id) {
                        <div class="flex items-start gap-2 mb-3">
                          @if (comment.authorPfp) {
                            <img [src]="'http://localhost:8081/uploads/' + comment.authorPfp" [alt]="comment.authorFullName" class="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                          } @else {
                            <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0 select-none">
                              {{ getInitials(comment.authorFullName ?? comment.authorUsername ?? '?') }}
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
                                    (click)="toggleCommentLike(post.id, comment.id)"
                                    class="flex items-center gap-1 text-xs transition-colors"
                                    [class.text-rose-600]="comment.isLiked"
                                    [class.text-slate-400]="!comment.isLiked"
                                  >
                                    <svg class="w-3.5 h-3.5" [attr.fill]="comment.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    {{ comment.likeCount ?? 0 }}
                                  </button>
                                  <!-- Report comment -->
                                  @if (! isOwnComment(comment.userId))
                                  {<button
                                    (click)="openReportComment(comment)"
                                    [disabled]="comment.isReportedByCurrentUser"
                                    class="transition-colors"
                                    [class.text-amber-500]="comment.isReportedByCurrentUser"
                                    [class.text-slate-300]="!comment.isReportedByCurrentUser"
                                    [class.hover:text-red-400]="!comment.isReportedByCurrentUser"
                                    [title]="comment.isReportedByCurrentUser ? 'Already reported' : 'Report comment'"
                                  >
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                                    </svg>
                                  </button>}
                                  <!-- Delete comment -->
                                  @if (isOwnComment(comment.userId)) {
                                    <button
                                      (click)="deleteComment(post.id, comment.id)"
                                      class="text-xs text-red-400 hover:text-red-600 transition-colors"
                                      title="Delete comment"
                                    >
                                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  }
                                </div>
                              </div>
                           
                              <app-mention-text
                                          class="text-slate-700"
                                          [text]="comment.content"
                                        />
                              <div class="flex items-center justify-between mt-1">
                                <button (click)="toggleReplies(comment.id)" class="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                                  @if (expandedComments().has(comment.id)) { Hide replies } @else { View replies }
                                </button>
                              </div>
                            </div>

                            @if (expandedComments().has(comment.id)) {
                              <div class="ml-4 mt-2 border-l-2 border-slate-200 pl-3 space-y-2">
                                @if (isRepliesLoading(comment.id)) {
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
                                            (click)="toggleCommentLike(post.id, reply.id)"
                                            class="flex items-center gap-0.5 transition-colors"
                                            [class.text-rose-500]="reply.isLiked"
                                            [class.text-slate-400]="!reply.isLiked"
                                          >
                                            <svg class="w-3 h-3" [attr.fill]="reply.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            {{ reply.likeCount ?? 0 }}
                                          </button>
                                          @if (isOwnComment(reply.userId)) {
                                            <button (click)="deleteReply(comment.id, reply.id)" class="text-red-400 hover:text-red-600 transition-colors" title="Delete reply">
                                              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                            </button>
                                          }
                                        </div>
                                      </div>
                                   
                                      <app-mention-text
                                                class="text-slate-700"
                                                [text]="reply.content"
                                              />
                                    </div>
                                  </div>
                                }
                                <div class="flex items-center gap-2 mt-1">
                               
                                  <app-mention-input
                                  class="flex-1"
                                  [value]="getReplyInput(comment.id)"
                                  (valueChange)="setReplyInput(comment.id, $event)"
                                  placeholder="Write a reply..."
                                />
                                  <button (click)="submitReply(comment.id)" class="text-xs px-2 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                    Send
                                  </button>
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      }

                      @if (feedService.commentHasMore().get(post.id)) {
                        <div class="text-center mt-2 mb-3">
                          <button (click)="feedService.loadMoreComments(post.id)" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                            Load more comments
                          </button>
                        </div>
                      }

                      <div class="flex items-center gap-2 mt-3">
                
                        <app-mention-input
                          class="flex-1"
                          [value]="getCommentInput(post.id)"
                          (valueChange)="setCommentInput(post.id, $event)"
                          placeholder="Write a comment..."
                        />
                        <button
                          (click)="submitComment(post.id)"
                          [disabled]="!getCommentInput(post.id).trim() || submittingComments().has(post.id)"
                          class="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center min-w-[52px]"
                        >
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

          @if (feedService.isLoadingMore()) {
            <div class="py-6 flex justify-center">
              <svg class="w-6 h-6 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </div>
          } @else if (!feedService.hasMore() && filteredPosts().length > 0) {
            <p class="text-center text-xs text-slate-400 py-4">You've reached the end</p>
          }
        }
      </section>
    </div>
  `
})
export class FeedComponent implements OnInit, OnDestroy {
  @ViewChild('createPostModal')    createPostModal!: CreatePostModalComponent;
  @ViewChild('createCommunityModal') createCommunityModal!: CreateCommunityModalComponent;
  @ViewChild('reportModal')        reportModal!: ReportModalComponent;

  readonly feedService = inject(FeedService);
  private readonly postFacade = inject(PostFacadeService);
  private readonly elementRef = inject(ElementRef);

  readonly searchQuery        = signal('');
  readonly expandedPosts      = signal<Set<number>>(new Set());
  readonly commentInputs      = signal<Map<number, string>>(new Map());
  readonly submittingComments = signal<Set<number>>(new Set());
  readonly expandedComments   = signal<Set<number>>(new Set());
  readonly replyInputs        = signal<Map<number, string>>(new Map());

  private scrollContainer: HTMLElement | null = null;
  private scrollListener = () => this.checkScroll();

  readonly filteredPosts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const posts = this.feedService.posts();
    if (!q) return posts;
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.authorFullName.toLowerCase().includes(q) ||
      p.communityTitle.toLowerCase().includes(q)
    );
  });

ngOnInit(): void {
  this.feedService.init();
  window.addEventListener('scroll', this.scrollListener);
}

ngOnDestroy(): void {
  window.removeEventListener('scroll', this.scrollListener);
}

private checkScroll(): void {
  if (this.feedService.isLoading() || this.feedService.isLoadingMore() || !this.feedService.hasMore()) return;
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 300) {
    this.feedService.loadMorePosts();
  }
}

  openCreatePost():    void { this.createPostModal.open(); }
  openCreateCommunity(): void { this.createCommunityModal.open(); }
  onPostCreated():     void { this.feedService.loadFeed(); }
  onCommunityCreated(): void { this.feedService.checkCommunities(); }

  // ─── REPORT ───────────────────────────────────────────────────────────────

  openReportPost(post: PostUI): void {
    if (post.isReportedByCurrentUser) return;
    this.reportModal.open('POST', post.id);
  }

  openReportComment(comment: CommentUI): void {
    if (comment.isReportedByCurrentUser) return;
    this.reportModal.open('COMMENT', comment.id);
  }

  onReported(): void {
    // Mark the reported item reactively without reloading the whole feed
    // The modal already closed — just refresh feed to get updated isReportedByCurrentUser
    this.feedService.loadFeed();
  }

  // ─── COMMENTS ─────────────────────────────────────────────────────────────

  toggleComments(postId: number): void {
    this.expandedPosts.update(set => {
      const next = new Set(set);
      if (next.has(postId)) {
        next.delete(postId);
        this.feedService.resetComments(postId);
      } else {
        next.add(postId);
        this.feedService.loadComments(postId);
      }
      return next;
    });
  }

  toggleReplies(commentId: number): void {
    this.expandedComments.update(set => {
      const next = new Set(set);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
        if (!this.feedService.replies().has(commentId)) {
          this.feedService.loadReplies(commentId);
        }
      }
      return next;
    });
  }

  getCommentInput(postId: number): string { return this.commentInputs().get(postId) ?? ''; }
  setCommentInput(postId: number, value: string): void { this.commentInputs.update(m => new Map(m).set(postId, value)); }

  async submitComment(postId: number): Promise<void> {
    const content = this.getCommentInput(postId).trim();
    if (!content) return;
    this.submittingComments.update(s => new Set(s).add(postId));
    try {
      await this.feedService.addComment(postId, content);
      this.commentInputs.update(m => { const n = new Map(m); n.delete(postId); return n; });
    } finally {
      this.submittingComments.update(s => { const n = new Set(s); n.delete(postId); return n; });
    }
  }

  async deleteComment(postId: number, commentId: number): Promise<void> {
    await this.feedService.deleteComment(postId, commentId);
  }

  getReplyInput(commentId: number): string { return this.replyInputs().get(commentId) ?? ''; }
  setReplyInput(commentId: number, value: string): void { this.replyInputs.update(m => new Map(m).set(commentId, value)); }

  async submitReply(commentId: number): Promise<void> {
    const content = this.getReplyInput(commentId).trim();
    if (!content) return;
    try {
      await this.feedService.createReply(commentId, content);
      this.replyInputs.update(m => { const n = new Map(m); n.delete(commentId); return n; });
    } catch (err) { console.error('Failed to send reply', err); }
  }

  async deleteReply(commentId: number, replyId: number): Promise<void> {
    try {
      await this.feedService.deleteReply(commentId, replyId);
    } catch (err) { console.error('Failed to delete reply', err); }
  }

  getReplies(commentId: number): CommentUI[] { return this.feedService.replies().get(commentId) ?? []; }
  isRepliesLoading(commentId: number): boolean { return this.feedService.repliesLoading().has(commentId); }

  toggleCommentLike(postId: number, commentId: number): void {
    this.feedService.toggleCommentLike(postId, commentId);
  }

  isOwnComment(commentUserId: number | undefined): boolean {
    const user = this.feedService.userContext.user();
    return !!user && !!commentUserId && user.id === commentUserId;
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

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}