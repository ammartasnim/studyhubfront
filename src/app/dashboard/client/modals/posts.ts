import {
  Component, inject, input, output, signal, computed, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { PostUI } from '../../../api/facades/models/post.model';
import { CommentUI } from '../../../api/facades/models/comment.model';
import { PostFacadeService } from '../../../api/facades/post.facade';
import { CommentFacadeService } from '../../../api/facades/comment.facade';
import { UserContextService } from '../../../services/user-context.service';
import { ReportModalComponent } from '../../../api/facades/models/report.model';
import { MentionInputComponent } from '../../../shared/components/mention-input';
import { MentionTextComponent } from '../../../shared/components/mention-text';
import { environment } from '../../../../environments/environment';
import { PaginatedComments } from '../../../api/facades/models/comment.model';


const COMMENT_PAGE_SIZE = 5;

interface CommentState {
  items: CommentUI[];
  page: number;
  hasMore: boolean;
  loading: boolean;
}

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReportModalComponent,
    MentionInputComponent,
    MentionTextComponent
  ],
  template: `
    <app-report-modal #reportModal (reported)="onReported()" />

    <article class="bg-white transition-colors hover:bg-slate-50/40">

      <!-- Post header -->
      <div class="flex items-start gap-3 px-6 pt-5 pb-3">
        @if (post().authorPfp) {
          <img
            (click)="navigateToProfile(post().authorId)"
            [src]="uploadUrl(post().authorPfp)"
            [alt]="post().authorFullName"
            class="w-10 h-10 rounded-full object-cover flex-shrink-0 cursor-pointer"
          />
        } @else {
          <div
            (click)="navigateToProfile(post().authorId)"
            class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0 select-none cursor-pointer"
          >
            {{ getInitials(post().authorFullName) }}
          </div>
        }

        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <p
              (click)="navigateToProfile(post().authorId)"
              class="font-semibold text-slate-900 text-sm cursor-pointer hover:text-indigo-600 transition-colors"
            >
              {{ post().authorFullName }}
            </p>

            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="text-xs text-slate-400 pt-0.5">{{ getTimeAgo(post().createdAt) }}</span>

              <!-- Status badge for pending -->
              @if (post().status === 'Pending') {
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200 font-semibold">
                  Pending
                </span>
              }

              <!-- Report -->
              @if (showReport()) {
                <button
                  (click)="openReport()"
                  [disabled]="post().isReportedByCurrentUser"
                  class="p-1 rounded-md transition-colors"
                  [class.text-amber-500]="post().isReportedByCurrentUser"
                  [class.text-slate-300]="!post().isReportedByCurrentUser"
                  [class.hover:text-red-400]="!post().isReportedByCurrentUser"
                  [title]="post().isReportedByCurrentUser ? 'Already reported' : 'Report post'"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                  </svg>
                </button>
              }

              <!-- Mod delete -->
              @if (canDeletePost()) {
                <button
                  (click)="onModDelete()"
                  class="p-1 rounded-md text-slate-300 hover:text-red-500 transition-colors"
                  title="Moderator delete"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              }

              <!-- Owner delete -->
              @if (showOwnerDelete() && isOwnPost()) {
                <button
                  (click)="onOwnerDelete()"
                  [disabled]="deleting()"
                  class="p-1 rounded-md text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Delete post"
                >
                  @if (deleting()) {
                    <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  } @else {
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                </button>
              }

              <!-- Edit -->
              @if (showEdit() && isOwnPost()) {
                <button
                  (click)="startEdit()"
                  class="p-1 rounded-md text-slate-300 hover:text-indigo-500 transition-colors"
                  title="Edit post"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              }
            </div>
          </div>

         @if (showCommunity()) {
  <div class="flex items-center gap-1 mt-0.5">
    <span class="text-xs text-slate-400">in</span>
    @if (post().communityTitle && post().communityTitle !== 'General') {
      <span (click)="navigateToCommunity(post().communityId)" class="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full cursor-pointer hover:bg-indigo-100 transition-colors">
        {{ post().communityTitle }}
      </span>
    } @else {
      <span class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
        General
      </span>
    }
  </div>
}
        </div>
      </div>

      <!-- Edit form -->
      @if (editing()) {
        <div class="mx-6 mb-3 p-4 bg-indigo-50 rounded-xl ring-1 ring-indigo-200">
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

          <!-- Existing images -->
          @if (editExistingImages().length > 0) {
            <p class="text-xs font-semibold text-slate-500 mb-1">Current images</p>
            <div class="grid grid-cols-3 gap-2 mb-2">
              @for (img of editExistingImages(); track img; let i = $index) {
                <div class="relative rounded-lg overflow-hidden aspect-square bg-slate-100">
                  <img [src]="uploadUrl(img)" class="w-full h-full object-cover" />
                  <button type="button" (click)="removeExistingImage(i)" class="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
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
                  <button type="button" (click)="removeEditImage(i)" class="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              }
            </div>
          }

          <!-- Add images -->
          @if (editExistingImages().length + editImages().length < 5) {
            <label class="cursor-pointer inline-block mb-2">
              <div class="flex items-center gap-2 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors text-xs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Add images {{ (editExistingImages().length + editImages().length) > 0 ? '(' + (editExistingImages().length + editImages().length) + '/5)' : '' }}
              </div>
              <input type="file" accept="image/*" multiple class="hidden" (change)="addEditImages($event)" />
            </label>
          }

          <div class="flex gap-2">
            <button (click)="saveEdit()" [disabled]="savingEdit()" class="px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {{ savingEdit() ? 'Saving...' : 'Save' }}
            </button>
            <button (click)="cancelEdit()" class="px-4 py-1.5 bg-white text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors border border-slate-200">
              Cancel
            </button>
          </div>
        </div>
      }

      <!-- Post content -->
      <div class="px-6 pb-3">
        <h3 class="font-bold text-slate-900 mb-1">{{ post().title }}</h3>
        <app-mention-text class="text-sm text-slate-700 leading-relaxed" [text]="post().content" />
      </div>

      <!-- Post images -->
      @if (post().images.length > 0) {
        <div class="px-6 pb-3">
          <div class="rounded-xl overflow-hidden"
            [class.grid]="post().images.length > 1"
            [class.grid-cols-2]="post().images.length > 1"
            [class.gap-0.5]="post().images.length > 1"
          >
            @for (img of post().images.slice(0, 4); track img; let i = $index) {
              <div class="relative bg-slate-100 overflow-hidden"
                [class.aspect-video]="post().images.length === 1"
                [class.aspect-square]="post().images.length > 1"
              >
                <img [src]="uploadUrl(img)" [alt]="post().title" class="w-full h-full object-cover" />
                @if (i === 3 && post().images.length > 4) {
                  <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span class="text-white text-2xl font-bold">+{{ post().images.length - 4 }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Approve / Reject (pending tab) -->
      @if (showApprove()) {
        <div class="px-6 pb-4 flex items-center gap-3">
          <button
            (click)="onApprove()"
            [disabled]="approving()"
            class="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            @if (approving()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            } @else { ✓ Approve }
          </button>
          <button
            (click)="onReject()"
            [disabled]="approving()"
            class="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 border border-red-200 disabled:opacity-50 transition-colors"
          >
            ✕ Reject
          </button>
        </div>
      }

      <!-- Like + Comment actions -->
      @if (showLike() || showComments()) {
        <div class="px-6 pb-4 flex items-center gap-2">
          @if (showLike()) {
            <button
              (click)="toggleLike()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              [class.text-rose-600]="localPost().isLiked"
              [class.bg-rose-50]="localPost().isLiked"
              [class.text-slate-600]="!localPost().isLiked"
              [class.hover:bg-slate-100]="!localPost().isLiked"
            >
              <svg class="w-4 h-4" [attr.fill]="localPost().isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {{ localPost().likeCount }}
            </button>
          }

          @if (showComments()) {
            <button
              (click)="toggleComments()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              [class.text-indigo-600]="commentsExpanded()"
              [class.bg-indigo-50]="commentsExpanded()"
              [class.text-slate-600]="!commentsExpanded()"
              [class.hover:bg-slate-100]="!commentsExpanded()"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {{ localPost().commentCount }}
            </button>
          }
        </div>
      }

      <!-- Comments section -->
      @if (showComments() && commentsExpanded()) {
        <div class="border-t border-slate-100 bg-slate-50/80 px-6 py-4">

          @if (commentState().loading && commentState().items.length === 0) {
            <div class="flex items-center gap-2 text-sm text-slate-500 py-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Loading comments...
            </div>
          } @else {

            @if (commentState().items.length === 0) {
              <p class="text-sm text-slate-400 text-center py-2 mb-3">No comments yet. Be the first!</p>
            }

            @for (comment of commentState().items; track comment.id) {
              <div class="flex items-start gap-2 mb-3">
                @if (comment.authorPfp) {
                  <img (click)="navigateToProfile(comment.userId)" [src]="uploadUrl(comment.authorPfp)" class="w-7 h-7 rounded-full object-cover flex-shrink-0 cursor-pointer" />
                } @else {
                  <div class="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold flex-shrink-0 select-none">
                    {{ getInitials(comment.authorFullName ?? '?') }}
                  </div>
                }

                <div class="flex-1">
                  <div class="bg-white rounded-xl px-3 py-2 text-sm border border-slate-100 shadow-sm">
                    <div class="flex items-center justify-between gap-2 mb-0.5">
                      <p (click)="navigateToProfile(comment.userId)" class="font-semibold text-slate-800 text-xs cursor-pointer hover:text-indigo-600 transition-colors">
                        {{ comment.authorFullName }}
                      </p>
                      <div class="flex items-center gap-2">
                        @if (comment.createdAt) {
                          <span class="text-xs text-slate-400">{{ getTimeAgo(comment.createdAt) }}</span>
                        }
                        <!-- Like comment -->
                        <button
                          (click)="toggleCommentLike(comment)"
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
                        @if (showReport() && !isOwnComment(comment.userId)) {
                          <button
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
                          </button>
                        }
                        <!-- Mod delete comment -->
                        @if (canDeleteComment() && !isOwnComment(comment.userId)) {
                          <button (click)="modDeleteComment(comment.id)" class="text-xs text-orange-400 hover:text-orange-600 transition-colors" title="Moderator delete">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        }
                        <!-- Own delete or post-owner delete -->
                        @if (isOwnComment(comment.userId) || isOwnPost()) {
                          <button (click)="deleteComment(comment.id)" class="text-xs text-red-400 hover:text-red-600 transition-colors" title="Delete comment">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        }
                      </div>
                    </div>
                    <app-mention-text class="text-slate-700" [text]="comment.content" />
                    <div class="mt-1">
                      <button (click)="toggleReplies(comment.id)" class="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                        @if (expandedReplies().has(comment.id)) { Hide replies } @else { View replies }
                      </button>
                    </div>
                  </div>

                  <!-- Replies -->
                  @if (expandedReplies().has(comment.id)) {
                    <div class="ml-4 mt-2 border-l-2 border-slate-200 pl-3 space-y-2">
                      @if (repliesLoading().has(comment.id)) {
                        <p class="text-xs text-slate-400 py-1">Loading replies...</p>
                      }
                      @for (reply of getReplies(comment.id); track reply.id) {
                        <div class="flex items-start gap-2">
                          @if (reply.authorPfp) {
                            <img (click)="navigateToProfile(reply.userId)" [src]="uploadUrl(reply.authorPfp)" class="w-6 h-6 rounded-full object-cover flex-shrink-0 cursor-pointer" />
                          } @else {
                            <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {{ getInitials(reply.authorFullName ?? '?') }}
                            </div>
                          }
                          <div class="flex-1 bg-white rounded-lg px-2 py-1.5 text-xs border border-slate-100 shadow-sm">
                            <div class="flex items-center justify-between mb-0.5">
                              <span (click)="navigateToProfile(reply.userId)" class="font-semibold text-slate-800 cursor-pointer hover:text-indigo-600 transition-colors">{{ reply.authorFullName }}</span>
                              <div class="flex items-center gap-1.5">
                                @if (reply.createdAt) {
                                  <span class="text-slate-400">{{ getTimeAgo(reply.createdAt) }}</span>
                                }
                                <button
                                  (click)="toggleCommentLike(reply)"
                                  class="flex items-center gap-0.5 transition-colors"
                                  [class.text-rose-500]="reply.isLiked"
                                  [class.text-slate-400]="!reply.isLiked"
                                >
                                  <svg class="w-3 h-3" [attr.fill]="reply.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  {{ reply.likeCount ?? 0 }}
                                </button>
                                @if (isOwnComment(reply.userId) || isOwnPost()) {
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
                          (valueChange)="setReplyInput(comment.id, $event)"
                          placeholder="Write a reply..."
                          [rows]="1"
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

            <!-- Load more comments -->
            @if (commentState().hasMore) {
              <div class="text-center mt-2 mb-3">
                <button (click)="loadMoreComments()" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                  Load more comments
                </button>
              </div>
            }

            <!-- Add comment -->
            <div class="flex items-center gap-2 mt-3">
              <app-mention-input
                class="flex-1"
                [value]="commentInput()"
                (valueChange)="commentInput.set($event)"
                placeholder="Write a comment..."
                [rows]="1"
              />
              <button
                (click)="submitComment()"
                [disabled]="!commentInput().trim() || submittingComment()"
                class="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center min-w-[52px]"
              >
                @if (submittingComment()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                } @else { Post }
              </button>
            </div>
            @if (commentError()) {
              <p class="mt-2 text-sm text-red-500">{{ commentError() }}</p>
            }
          }
        </div>
      }
    </article>
  `
})
export class PostCardComponent {
  // ─── ViewChild for report modal ───────────────────────────────────────────
  reportModal: any;

private readonly postFacade    = inject<PostFacadeService>(PostFacadeService);
private readonly commentFacade = inject<CommentFacadeService>(CommentFacadeService);
private readonly userContext!: UserContextService;  
private readonly router        = inject<Router>(Router);
private readonly http          = inject<HttpClient>(HttpClient);

  // ─── INPUTS ───────────────────────────────────────────────────────────────
  readonly post = input.required<PostUI>();

  // Visibility flags
  readonly showLike        = input(true);
  readonly showComments    = input(true);
  readonly showReport      = input(true);
  readonly showCommunity   = input(true);
  readonly canDeletePost   = input(false);   
  readonly canDeleteComment = input(false);  
  readonly showOwnerDelete = input(false);   
  readonly showEdit        = input(false);   
  readonly showApprove     = input(false);   
  readonly isProfilePage = input(false);

  // ─── OUTPUTS ──────────────────────────────────────────────────────────────
  readonly postDeleted  = output<number>();
  readonly postApproved = output<number>();
  readonly postRejected = output<number>();
  readonly postUpdated  = output<PostUI>();

  // ─── LOCAL STATE ──────────────────────────────────────────────────────────

  // Mutable local copy of the post for reactive like/comment updates
  readonly localPost = signal<PostUI>(null!);

  // Comments
  readonly commentsExpanded  = signal(false);
  readonly commentState      = signal<CommentState>({ items: [], page: 0, hasMore: false, loading: false });
  readonly commentInput      = signal('');
  readonly submittingComment = signal(false);
  readonly commentError      = signal<string | null>(null);

  // Replies
  readonly expandedReplies = signal<Set<number>>(new Set());
  readonly repliesLoading  = signal<Set<number>>(new Set());
  readonly repliesMap      = signal<Map<number, CommentUI[]>>(new Map());
  readonly replyInputs     = signal<Map<number, string>>(new Map());

  // Edit
  readonly editing          = signal(false);
  readonly savingEdit       = signal(false);
  readonly editExistingImages = signal<string[]>([]);
  readonly editImages       = signal<File[]>([]);
  readonly editPreviews     = signal<string[]>([]);
  editTitle   = '';
  editContent = '';

  // Delete / Approve
  readonly deleting  = signal(false);
  readonly approving = signal(false);

  // Report target (for comment reporting)
  private reportTarget: { type: 'POST' | 'COMMENT'; id: number } | null = null;

  // ─── INIT ─────────────────────────────────────────────────────────────────

  constructor() {
     this.userContext = inject(UserContextService);
  }

  ngOnInit() {
    this.localPost.set({ ...this.post() });
  }

  // ─── COMPUTED ─────────────────────────────────────────────────────────────

readonly isOwnPost = computed(() => {
  const user = this.userContext.user();
  return !!user && user.id === (this.post() as any).authorId;
});

isOwnComment(userId: number | undefined): boolean {
  const user = this.userContext.user();
  return !!user && !!userId && user.id === userId;
}

  // ─── LIKE ─────────────────────────────────────────────────────────────────

  async toggleLike(): Promise<void> {
    try {
      await firstValueFrom(this.postFacade.toggleLike(this.post().id));
      this.localPost.update(p => ({
        ...p,
        isLiked: !p.isLiked,
        likeCount: p.likeCount + (p.isLiked ? -1 : 1)
      }));
    } catch (err) {
      console.error('Failed to toggle like', err);
    }
  }

  // ─── REPORT ───────────────────────────────────────────────────────────────

  openReport(): void {
    if (this.post().isReportedByCurrentUser) return;
    this.reportTarget = { type: 'POST', id: this.post().id };
    // Use ViewChild reference
    (this as any).reportModalRef?.open('POST', this.post().id);
  }

  openReportComment(comment: CommentUI): void {
    if (comment.isReportedByCurrentUser) return;
    this.reportTarget = { type: 'COMMENT', id: comment.id };
  }

  onReported(): void {
    if (!this.reportTarget) return;
    if (this.reportTarget.type === 'POST') {
      this.localPost.update(p => ({ ...p, isReportedByCurrentUser: true }));
    } else {
      this.commentState.update(s => ({
        ...s,
        items: s.items.map(c =>
          c.id === this.reportTarget!.id ? { ...c, isReportedByCurrentUser: true } : c
        )
      }));
    }
    this.reportTarget = null;
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async onModDelete(): Promise<void> {
    if (!confirm('Delete this post as moderator?')) return;
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiBaseUrl}/api/posts/${this.post().id}/moderate`)
      );
      this.postDeleted.emit(this.post().id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete post');
    }
  }

  async onOwnerDelete(): Promise<void> {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    this.deleting.set(true);
    try {
      await firstValueFrom(this.postFacade.delete(this.post().id));
      this.postDeleted.emit(this.post().id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete post');
    } finally {
      this.deleting.set(false);
    }
  }

  // ─── APPROVE / REJECT ─────────────────────────────────────────────────────

  async onApprove(): Promise<void> {
    this.approving.set(true);
    try {
      await firstValueFrom(this.postFacade.approve(this.post().id));
      this.postApproved.emit(this.post().id);
    } catch (err: any) {
      alert(err?.message || 'Failed to approve post');
    } finally {
      this.approving.set(false);
    }
  }

  async onReject(): Promise<void> {
    if (!confirm(`Reject and delete "${this.post().title}"?`)) return;
    this.approving.set(true);
    try {
      await firstValueFrom(this.postFacade.reject(this.post().id));
      this.postRejected.emit(this.post().id);
    } catch (err: any) {
      alert(err?.message || 'Failed to reject post');
    } finally {
      this.approving.set(false);
    }
  }

  // ─── EDIT ─────────────────────────────────────────────────────────────────

  startEdit(): void {
    this.editTitle   = this.post().title;
    this.editContent = this.post().content;
    this.editExistingImages.set([...this.post().images]);
    this.editImages.set([]);
    this.editPreviews.set([]);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.editTitle = '';
    this.editContent = '';
    this.editExistingImages.set([]);
    this.editImages.set([]);
    this.editPreviews.set([]);
  }

  async saveEdit(): Promise<void> {
    if (!this.editTitle.trim() || !this.editContent.trim()) return;
    this.savingEdit.set(true);
    try {
     const updated: PostUI = await firstValueFrom(this.postFacade.update(this.post().id, {
        title:   this.editTitle.trim(),
        content: this.editContent.trim(),
        imgs:    this.editImages().length > 0 ? this.editImages() : undefined
        }));
      const merged = {
        ...updated,
        images: [...this.editExistingImages(), ...updated.images]
      };
      this.localPost.set(merged);
      this.postUpdated.emit(merged);
      this.cancelEdit();
    } catch (err: any) {
      alert(err?.message || 'Failed to update post');
    } finally {
      this.savingEdit.set(false);
    }
  }

  addEditImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const remaining = 5 - this.editExistingImages().length - this.editImages().length;
    const newFiles = Array.from(input.files).slice(0, remaining);
    this.editImages.update(e => [...e, ...newFiles]);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => this.editPreviews.update(p => [...p, e.target!.result as string]);
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeExistingImage(i: number): void {
    this.editExistingImages.update(imgs => imgs.filter((_, idx) => idx !== i));
  }

  removeEditImage(i: number): void {
    this.editImages.update(imgs => imgs.filter((_, idx) => idx !== i));
    this.editPreviews.update(p => p.filter((_, idx) => idx !== i));
  }

  // ─── COMMENTS ─────────────────────────────────────────────────────────────

  toggleComments(): void {
    if (this.commentsExpanded()) {
      this.commentsExpanded.set(false);
      this.commentState.set({ items: [], page: 0, hasMore: false, loading: false });
    } else {
      this.commentsExpanded.set(true);
      this.loadComments();
    }
  }

  async loadComments(): Promise<void> {
    this.commentState.update(s => ({ ...s, loading: true }));
    try {
    const result: PaginatedComments = await firstValueFrom(
  this.commentFacade.getByPostPaged(this.post().id, 0, COMMENT_PAGE_SIZE)
);
      this.commentState.set({
        items: result.items,
        page: 0,
        hasMore: result.totalItems > result.items.length,
        loading: false
      });
    } catch {
      this.commentState.update(s => ({ ...s, loading: false }));
    }
  }

  async loadMoreComments(): Promise<void> {
    
    const state = this.commentState();
    if (state.loading || !state.hasMore) return;
    this.commentState.update(s => ({ ...s, loading: true }));
    try {
      const nextPage = state.page + 1;
      const result: PaginatedComments = await firstValueFrom(
    this.commentFacade.getByPostPaged(this.post().id, nextPage, COMMENT_PAGE_SIZE)
    );
      const existingIds = new Set(state.items.map(c => c.id));
      const newItems = result.items.filter(c => !existingIds.has(c.id));
      this.commentState.set({
        items: [...state.items, ...newItems],
        page: nextPage,
        hasMore: state.items.length + newItems.length < result.totalItems,
        loading: false
      });
    } catch {
      this.commentState.update(s => ({ ...s, loading: false }));
    }
  }

  async submitComment(): Promise<void> {
    const content = this.commentInput().trim();
    if (!content) return;
    this.submittingComment.set(true);
    this.commentError.set(null);
    try {
      const comment = await firstValueFrom(
        this.commentFacade.create({ content, postId: this.post().id })
      );
      const state = this.commentState();
      this.commentState.update(s => ({ ...s, items: [...s.items, comment] }));
      this.localPost.update(p => ({ ...p, commentCount: p.commentCount + 1 }));
      this.commentInput.set('');
    } catch (err: any) {
      this.commentError.set(err?.message || 'Failed to add comment');
    } finally {
      this.submittingComment.set(false);
    }
  }

  async deleteComment(commentId: number): Promise<void> {
    try {
      await firstValueFrom(this.commentFacade.delete(commentId));
      this.commentState.update(s => ({
        ...s, items: s.items.filter(c => c.id !== commentId)
      }));
      this.localPost.update(p => ({ ...p, commentCount: Math.max(0, p.commentCount - 1) }));
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  }

  async modDeleteComment(commentId: number): Promise<void> {
    if (!confirm('Delete this comment as moderator?')) return;
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiBaseUrl}/api/comments/${commentId}/moderate`)
      );
      this.commentState.update(s => ({
        ...s, items: s.items.filter(c => c.id !== commentId)
      }));
      this.localPost.update(p => ({ ...p, commentCount: Math.max(0, p.commentCount - 1) }));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete comment');
    }
  }

  async toggleCommentLike(comment: CommentUI): Promise<void> {
    try {
      await firstValueFrom(this.commentFacade.toggleLike(comment.id));
      const update = (list: CommentUI[]) =>
        list.map(c => c.id === comment.id
          ? { ...c, isLiked: !c.isLiked, likeCount: c.likeCount + (c.isLiked ? -1 : 1) }
          : c
        );
      this.commentState.update(s => ({ ...s, items: update(s.items) }));
      // Also update in replies
      this.repliesMap.update(m => {
        const next = new Map(m);
        next.forEach((replies, key) => next.set(key, update(replies)));
        return next;
      });
    } catch (err) {
      console.error('Failed to toggle comment like', err);
    }
  }

  // ─── REPLIES ──────────────────────────────────────────────────────────────

  getReplies(commentId: number): CommentUI[] {
    return this.repliesMap().get(commentId) ?? [];
  }

  getReplyInput(commentId: number): string {
    return this.replyInputs().get(commentId) ?? '';
  }

  setReplyInput(commentId: number, value: string): void {
    this.replyInputs.update(m => new Map(m).set(commentId, value));
  }

  toggleReplies(commentId: number): void {
    this.expandedReplies.update(set => {
      const next = new Set(set);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
        if (!this.repliesMap().has(commentId)) {
          this.loadReplies(commentId);
        }
      }
      return next;
    });
  }

  async loadReplies(commentId: number): Promise<void> {
    this.repliesLoading.update(s => new Set(s).add(commentId));
    try {
     const result: PaginatedComments = await firstValueFrom(
            this.commentFacade.getReplies(commentId)
            );
    } catch (err) {
      console.error('Failed to load replies', err);
    } finally {
      this.repliesLoading.update(s => { const n = new Set(s); n.delete(commentId); return n; });
    }
  }

  async submitReply(commentId: number): Promise<void> {
    const content = this.getReplyInput(commentId).trim();
    if (!content) return;
    try {
      const reply = await firstValueFrom(this.commentFacade.createReply(commentId, { content }));
      this.repliesMap.update(m => {
        const next = new Map(m);
        next.set(commentId, [...(next.get(commentId) ?? []), reply]);
        return next;
      });
      this.setReplyInput(commentId, '');
    } catch (err) {
      console.error('Failed to submit reply', err);
    }
  }

  async deleteReply(commentId: number, replyId: number): Promise<void> {
    try {
      await firstValueFrom(this.commentFacade.delete(replyId));
      this.repliesMap.update(m => {
        const next = new Map(m);
        next.set(commentId, (next.get(commentId) ?? []).filter(r => r.id !== replyId));
        return next;
      });
    } catch (err) {
      console.error('Failed to delete reply', err);
    }
  }

  // ─── NAVIGATION ───────────────────────────────────────────────────────────

navigateToProfile(id?: number): void {
  if (!id) return;
  const currentUser = this.userContext.user();
  if (this.isProfilePage()) {
    if (currentUser && id == currentUser.id) return;
    this.router.navigate(['/dashboard/client/profile', id]);
    return;
  }
   if (currentUser && id == currentUser.id) 
     this.router.navigate(['/dashboard/client/profile']);
    else
    {this.router.navigate(['/dashboard/client/profile', id]);}
    
}
  navigateToCommunity(id?: number): void {
    if (id) this.router.navigate(['/dashboard/client/community', id]);
  }

  // ─── UTILS ────────────────────────────────────────────────────────────────

  uploadUrl(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.apiBaseUrl}/uploads/${path}`;
  }

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
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