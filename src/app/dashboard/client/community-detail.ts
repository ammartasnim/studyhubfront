import { Component, inject, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { CommunityFacadeService, CommunityMemberUI, PostFacadeService, CommunityUI, PostUI } from '../../api/facades';
import { UserContextService } from '../../user-context.service';
import { CreatePostModalComponent } from './create-post';

const ALL_PERMISSIONS = [
  'EDIT_COMMUNITY', 'ADD_MODERATOR', 'REMOVE_MODERATOR',
  'VIEW_MEMBERS', 'BAN_MEMBER', 'WARN_MEMBER',
  'DELETE_POST', 'DELETE_COMMENT'
];

@Component({
  selector: 'app-community-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CreatePostModalComponent],
  template: `
    <app-create-post-modal #createPostModal [prefilledCommunityId]="communityId()" (postCreated)="onPostCreated()" />

    <div class="flex flex-col gap-6 max-w-4xl mx-auto pb-10">

      <!-- Back Button -->
      <button (click)="goBack()" class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium w-fit">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Communities
      </button>

      @if (loading()) {
        <div class="p-10 flex justify-center">
          <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      } @else if (error()) {
        <div class="p-10 text-center bg-white rounded-2xl border border-red-200">
          <h2 class="text-xl font-bold text-slate-900">Community Not Found</h2>
          <p class="mt-2 text-slate-500">{{ error() }}</p>
          <button (click)="goBack()" class="mt-6 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl">Go Back</button>
        </div>
      } @else if (community()) {

        <!-- Banner Header -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500"></div>
          <div class="px-6 sm:px-8 pb-6">
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
              <div class="flex items-end gap-5">
                <div class="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center flex-shrink-0 text-3xl font-bold text-indigo-600">
                  {{ getInitials(community()!.title) }}
                </div>
                <div class="mb-1">
                  <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">{{ community()!.title }}</h1>
                  <p class="text-slate-500 font-medium mt-1">c/{{ community()!.title.toLowerCase().replace(' ', '') }} • {{ community()!.nbrMembers }} members</p>
                </div>
              </div>
              <div class="flex gap-3 mb-1 flex-wrap">
                @if (isOwner()) {
                  <button (click)="activeTab.set('settings')" class="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
                    ⚙ Settings
                  </button>
                  <button (click)="confirmDelete()" class="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors border border-red-200">
                    Delete
                  </button>
                } @else if (isModerator()) {
                  <button (click)="activeTab.set('settings')" class="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
                    ⚙ Mod Panel
                  </button>
                  @if (!isMember()) {
                    <button (click)="joinCommunity()" class="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                      Join Community
                    </button>
                  } @else {
                    <button (click)="leaveCommunity()" class="px-5 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
                      Leave
                    </button>
                  }
                } @else if (isMember()) {
                  <button (click)="leaveCommunity()" class="px-5 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
                    Leave Community
                  </button>
                } @else {
                  <button (click)="joinCommunity()" class="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                    Join Community
                  </button>
                }
              </div>
            </div>
            <div class="mt-6">
              <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">About Community</h3>
              <p class="text-slate-700 leading-relaxed whitespace-pre-line">{{ community()!.description }}</p>
              @if (community()!.category) {
                <span class="mt-2 inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{{ community()!.category }}</span>
              }
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button (click)="activeTab.set('feed')" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors" [class.bg-white]="activeTab() === 'feed'" [class.text-slate-900]="activeTab() === 'feed'" [class.text-slate-500]="activeTab() !== 'feed'">Feed</button>
          @if (isOwner() || isModerator()) {
            <button (click)="activeTab.set('settings'); loadSettingsData()" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors" [class.bg-white]="activeTab() === 'settings'" [class.text-slate-900]="activeTab() === 'settings'" [class.text-slate-500]="activeTab() !== 'settings'">Settings</button>
          }
        </div>

        <!-- Feed Tab -->
        @if (activeTab() === 'feed') {
          @if (isMember() || isOwner() || isModerator()) {
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0"></div>
              <input type="text" readonly (click)="openCreatePost()" placeholder="Create a post..." class="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-full px-4 py-2.5 cursor-text text-slate-600 focus:outline-none transition-colors" />
            </div>
          }

          <div class="flex flex-col gap-4">
            <h2 class="text-xl font-bold text-slate-900 px-1">Community Feed</h2>
            @if (postsLoading()) {
              <div class="p-10 flex justify-center">
                <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            } @else if (posts().length === 0) {
              <div class="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <h3 class="text-lg font-semibold text-slate-900">No posts yet</h3>
                <p class="text-slate-500 mt-1 mb-4">Be the first to share something!</p>
                @if (isMember() || isOwner() || isModerator()) {
                  <button (click)="openCreatePost()" class="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700">Create Post</button>
                }
              </div>
            } @else {
              <div class="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                @for (post of posts(); track post.id) {
                  <article class="p-6 transition-colors hover:bg-slate-50">
                    <div class="flex items-start gap-3 mb-3">
                      <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm select-none">
                        {{ getInitials(post.authorFullName) }}
                      </div>
                      <div class="flex-1">
                        <div class="flex justify-between items-start">
                          <p class="font-semibold text-slate-900 text-sm">{{ post.authorFullName }}</p>
                          <div class="flex items-center gap-2">
                            <span class="text-xs text-slate-400">{{ getTimeAgo(post.createdAt) }}</span>
                            @if (canModerateContent()) {
                              <button (click)="moderatorDeletePost(post.id)" class="text-red-400 hover:text-red-600 transition-colors" title="Moderator delete">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    <h3 class="font-bold text-slate-900 mb-2">{{ post.title }}</h3>
                    <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{{ post.content }}</p>
                    @if (post.images.length > 0) {
                      <div class="mt-3 rounded-xl overflow-hidden" [class.grid]="post.images.length > 1" [class.grid-cols-2]="post.images.length > 1" [class.gap-0.5]="post.images.length > 1">
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
                    }
                    <div class="mt-4 flex items-center gap-4">
                      <button (click)="toggleLike(post)" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors" [class.text-rose-600]="post.isLiked" [class.bg-rose-50]="post.isLiked" [class.text-slate-600]="!post.isLiked" [class.hover:bg-slate-100]="!post.isLiked">
                        <svg class="w-4 h-4" [attr.fill]="post.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        {{ post.likeCount }}
                      </button>
                      <span class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {{ post.commentCount }}
                      </span>
                    </div>
                  </article>
                }
              </div>
            }
          </div>
        }

        <!-- Settings Tab -->
        @if (activeTab() === 'settings') {
          <div class="flex flex-col gap-6">

            <!-- Edit Community Info — owner or EDIT_COMMUNITY permission -->
            @if (isOwner() || hasPermission('EDIT_COMMUNITY')) {
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-4">Community Info</h3>
                <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="space-y-4">
                  <div>
                    <label class="block text-sm font-semibold mb-1">Name</label>
                    <input type="text" formControlName="title" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-1">Description</label>
                    <textarea formControlName="description" rows="3" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"></textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold mb-1">Category</label>
                    <select formControlName="category" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                      <option value="">Select a category...</option>
                      <option value="programming">Programming</option>
                      <option value="design">Design</option>
                      <option value="business">Business</option>
                      <option value="science">Science</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <button type="submit" [disabled]="editForm.invalid || savingEdit()" class="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    {{ savingEdit() ? 'Saving...' : 'Save Changes' }}
                  </button>
                </form>
              </div>
            }

            <!-- Moderator Management — owner only -->
            @if (isOwner() || hasPermission('ADD_MODERATOR')) {
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-4">Moderators</h3>

                <!-- Current moderators -->
                @if (community()!.moderators && community()!.moderators!.length > 0) {
                  <div class="space-y-3 mb-6">
                    @for (mod of community()!.moderators!; track mod.userId) {
                      <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <p class="font-semibold text-slate-900 text-sm">{{ mod.fullName }}</p>
                          <p class="text-xs text-slate-500">&#64;{{ mod.username }}</p>
                          <div class="flex flex-wrap gap-1 mt-1">
                            @for (perm of mod.permissions ?? []; track perm) {
                              <span class="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{{ perm }}</span>
                            }
                          </div>
                        </div>
                        @if (isOwner()) {
                          <button (click)="removeModerator(mod.userId!)" class="text-red-400 hover:text-red-600 text-xs font-medium transition-colors">Remove</button>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-sm text-slate-400 mb-4">No moderators yet.</p>
                }

                <!-- Add moderator -->
                @if (isOwner()) {
                  <div class="border-t border-slate-100 pt-4">
                    <h4 class="text-sm font-bold text-slate-700 mb-3">Add Moderator</h4>
                    <div class="flex gap-2 mb-3">
                      <input type="text" [(ngModel)]="modSearchQuery"  (input)="searchUsers()" placeholder="Search by username..." class="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                    @if (userSearchResults().length > 0) {
                      <div class="border border-slate-200 rounded-xl overflow-hidden mb-3">
                        @for (user of userSearchResults(); track user.id) {
                          <button (click)="selectUserForMod(user)" class="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0">
                            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{{ getInitials(user.firstName + ' ' + user.lastName) }}</div>
                            <div>
                              <p class="text-sm font-medium text-slate-900">{{ user.firstName }} {{ user.lastName }}</p>
                              <p class="text-xs text-slate-500">&#64;{{ user.username }}</p>
                            </div>
                          </button>
                        }
                      </div>
                    }
                    @if (selectedModUser()) {
                      <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-3">
                        <p class="text-sm font-semibold text-indigo-900">Selected: {{ selectedModUser()!.firstName }} {{ selectedModUser()!.lastName }}</p>
                        <p class="text-xs text-indigo-600 mb-2">&#64;{{ selectedModUser()!.username }}</p>
                        <p class="text-xs font-semibold text-slate-700 mb-2">Permissions:</p>
                        <div class="grid grid-cols-2 gap-1">
                          @for (perm of allPermissions; track perm) {
                            <label class="flex items-center gap-2 text-xs cursor-pointer">
                              <input type="checkbox" [checked]="selectedPermissions().has(perm)" (change)="togglePermission(perm)" class="rounded" />
                              {{ perm.replace('_', ' ') }}
                            </label>
                          }
                        </div>
                        <button (click)="addModerator()" [disabled]="addingMod()" class="mt-3 px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                          {{ addingMod() ? 'Adding...' : 'Add Moderator' }}
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Member Management — owner or VIEW_MEMBERS permission -->
            @if (isOwner() || hasPermission('VIEW_MEMBERS')) {
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-4">Members</h3>
                @if (membersLoading()) {
                  <div class="flex justify-center py-6">
                    <div class="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                } @else if (members().length === 0) {
                  <p class="text-sm text-slate-400">No members found.</p>
                } @else {
                  <div class="space-y-3">
                    @for (member of members(); track member.userId) {
                      <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                            {{ getInitials(member.fullName) }}
                          </div>
                          <div>
                            <p class="text-sm font-semibold text-slate-900">{{ member.fullName }}</p>
                            <div class="flex items-center gap-2">
                              <p class="text-xs text-slate-500">&#64;{{ member.username }}</p>
                              @if (member.isModerator) {
                                <span class="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Mod</span>
                              }
                              @if (member.warningCount > 0) {
                                <span class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{{ member.warningCount }} warning{{ member.warningCount > 1 ? 's' : '' }}</span>
                              }
                            </div>
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          @if (isOwner() || hasPermission('WARN_MEMBER')) {
                            <button (click)="openWarnModal(member)" class="text-xs px-2 py-1 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200">Warn</button>
                          }
                          @if (isOwner() || hasPermission('BAN_MEMBER')) {
                            <button (click)="openBanModal(member)" class="text-xs px-2 py-1 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200">Ban</button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Transfer Ownership — owner only -->
            @if (isOwner()) {
              <div class="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
                <h3 class="text-lg font-bold text-red-700 mb-2">Danger Zone</h3>
                <p class="text-sm text-slate-500 mb-4">Transfer ownership to another member. You will lose owner privileges.</p>
                <div class="flex gap-2">
                  <input type="number" [(ngModel)]="transferToUserId"  placeholder="User ID to transfer to" class="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-400 focus:outline-none" />
                  <button (click)="transferOwnership()" class="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">Transfer</button>
                </div>
              </div>
            }

          </div>
        }
      }
    </div>

    <!-- Delete Confirmation Modal -->
    @if (showDeleteModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h2 class="text-xl font-bold text-slate-900 mb-3">Delete Community?</h2>
          <p class="text-slate-600 mb-6">This cannot be undone. All posts will be permanently removed.</p>
          <div class="flex gap-3">
            <button (click)="closeDeleteModal()" [disabled]="deletingCommunity()" class="flex-1 px-4 py-2 border rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-50">Cancel</button>
            <button (click)="executeDelete()" [disabled]="deletingCommunity()" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">
              {{ deletingCommunity() ? 'Deleting...' : 'Yes, Delete' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Ban Modal -->
    @if (showBanModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h2 class="text-xl font-bold text-slate-900 mb-2">Ban {{ banTarget()?.fullName }}?</h2>
          <p class="text-sm text-slate-500 mb-4">They will be removed from the community and cannot rejoin.</p>
          <textarea [(ngModel)]="banReason"  placeholder="Reason for ban..." rows="3" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:outline-none mb-4 resize-none"></textarea>
          <div class="flex gap-3">
            <button (click)="showBanModal.set(false)" class="flex-1 px-4 py-2 border rounded-xl font-semibold hover:bg-slate-50">Cancel</button>
            <button (click)="executeBan()" [disabled]="actionLoading()" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">
              {{ actionLoading() ? 'Banning...' : 'Ban Member' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Warn Modal -->
    @if (showWarnModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h2 class="text-xl font-bold text-slate-900 mb-2">Warn {{ warnTarget()?.fullName }}?</h2>
          <p class="text-sm text-slate-500 mb-4">They will receive a warning. After 3 warnings they will be auto-banned.</p>
          <textarea [(ngModel)]="warnReason" placeholder="Reason for warning..." rows="3" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none mb-4 resize-none"></textarea>
          <div class="flex gap-3">
            <button (click)="showWarnModal.set(false)" class="flex-1 px-4 py-2 border rounded-xl font-semibold hover:bg-slate-50">Cancel</button>
            <button (click)="executeWarn()" [disabled]="actionLoading()" class="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 disabled:opacity-50">
              {{ actionLoading() ? 'Warning...' : 'Send Warning' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class CommunityDetailComponent implements OnInit {
  @ViewChild('createPostModal') createPostModal!: CreatePostModalComponent;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly communityFacade = inject(CommunityFacadeService);
  private readonly postFacade = inject(PostFacadeService);
  private readonly userContext = inject(UserContextService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly communityId = signal<number>(0);
  readonly community = signal<CommunityUI | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly posts = signal<PostUI[]>([]);
  readonly postsLoading = signal(true);
  readonly activeTab = signal<'feed' | 'settings'>('feed');
  readonly members = signal<CommunityMemberUI[]>([]);
  readonly membersLoading = signal(false);
  readonly savingEdit = signal(false);
  readonly showDeleteModal = signal(false);
  readonly deletingCommunity = signal(false);
  readonly addingMod = signal(false);
  readonly actionLoading = signal(false);
  readonly showBanModal = signal(false);
  readonly showWarnModal = signal(false);
  readonly banTarget = signal<CommunityMemberUI | null>(null);
  readonly warnTarget = signal<CommunityMemberUI | null>(null);
  readonly userSearchResults = signal<any[]>([]);
  readonly selectedModUser = signal<any | null>(null);
  readonly selectedPermissions = signal<Set<string>>(new Set());

  banReason = '';
  warnReason = '';
  modSearchQuery = '';
  transferToUserId: number | null = null;
  allPermissions = ALL_PERMISSIONS;

  readonly editForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: ['']
  });

  readonly isOwner = computed(() => {
    const user = this.userContext.user();
    const comm = this.community();
    if (!user || !comm) return false;
    return user.id === comm.ownerId;
  });

  readonly isModerator = computed(() => {
    const user = this.userContext.user();
    const comm = this.community();
    if (!user || !comm) return false;
    return (comm.moderators ?? []).some(m => m.userId === user.id);
  });

  readonly isMember = computed(() => {
    // We track this via a separate signal since CommunityUI doesn't include membership
    return this._isMember();
  });

  private readonly _isMember = signal(false);

  readonly canModerateContent = computed(() => {
    return this.isOwner() || this.hasPermission('DELETE_POST');
  });

  hasPermission(perm: string): boolean {
    const user = this.userContext.user();
    const comm = this.community();
    if (!user || !comm) return false;
    const mod = (comm.moderators ?? []).find(m => m.userId === user.id);
    return mod?.permissions?.includes(perm) ?? false;
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = parseInt(params.get('id') || '0', 10);
      if (id > 0) {
        this.communityId.set(id);
        this.loadData(id);
      } else {
        this.error.set('Invalid community ID');
        this.loading.set(false);
      }
    });
  }

  async loadData(id: number) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const comm = await firstValueFrom(this.communityFacade.getById(id));
      this.community.set(comm);
      this.editForm.patchValue({ title: comm.title, description: comm.description, category: comm.category ?? '' });
      await this.checkMembership(id);
      this.loadPosts(id);
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to load community');
    } finally {
      this.loading.set(false);
    }
  }

  async checkMembership(communityId: number) {
    try {
      const result = await firstValueFrom(this.communityFacade.getMy({ size: 100 }));
      this._isMember.set(result.items.some(c => c.id === communityId));
    } catch {
      this._isMember.set(false);
    }
  }

  async loadPosts(id: number) {
    this.postsLoading.set(true);
    try {
      const response: any = await firstValueFrom(this.postFacade.getByCommunity(id));
      this.posts.set(response.content || response.items || []);
    } catch (err: any) {
      console.error('Failed to load posts', err);
    } finally {
      this.postsLoading.set(false);
    }
  }

  async loadSettingsData() {
    if (this.isOwner() || this.hasPermission('VIEW_MEMBERS')) {
      this.membersLoading.set(true);
      try {
        const result = await firstValueFrom(this.communityFacade.getMembers(this.communityId()));
        this.members.set(result.items);
      } catch (err) {
        console.error('Failed to load members', err);
      } finally {
        this.membersLoading.set(false);
      }
    }
  }

  async joinCommunity() {
    try {
      await firstValueFrom(this.communityFacade.join(this.communityId()));
      this._isMember.set(true);
      this.community.update(c => c ? { ...c, nbrMembers: c.nbrMembers + 1 } : c);
    } catch (err: any) {
      alert(err?.message || 'Failed to join community');
    }
  }

  async leaveCommunity() {
    try {
      await firstValueFrom(this.communityFacade.leave(this.communityId()));
      this._isMember.set(false);
      this.community.update(c => c ? { ...c, nbrMembers: Math.max(0, c.nbrMembers - 1) } : c);
    } catch (err: any) {
      alert(err?.message || 'Failed to leave community');
    }
  }

  async saveEdit() {
    if (this.editForm.invalid) return;
    this.savingEdit.set(true);
    try {
      const vals = this.editForm.getRawValue();
      const updated = await firstValueFrom(this.communityFacade.update(this.communityId(), vals));
      this.community.set(updated);
    } catch (err: any) {
      alert('Failed to update: ' + (err.message || 'Unknown error'));
    } finally {
      this.savingEdit.set(false);
    }
  }

  async searchUsers() {
    if (!this.modSearchQuery.trim() || this.modSearchQuery.length < 2) {
      this.userSearchResults.set([]);
      return;
    }
    try {
      const result: any = await firstValueFrom(
        this.http.get(`http://localhost:8081/api/clients/search?username=${encodeURIComponent(this.modSearchQuery)}&size=5`)
      );
      this.userSearchResults.set(result.content ?? []);
    } catch {
      this.userSearchResults.set([]);
    }
  }

  selectUserForMod(user: any) {
    this.selectedModUser.set(user);
    this.userSearchResults.set([]);
    this.modSearchQuery = user.username;
  }

  togglePermission(perm: string) {
    this.selectedPermissions.update(set => {
      const next = new Set(set);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  }

  async addModerator() {
    const user = this.selectedModUser();
    if (!user) return;
    this.addingMod.set(true);
    try {
      await firstValueFrom(this.communityFacade.addModerator(
        this.communityId(), user.id, [...this.selectedPermissions()]
      ));
      await this.loadData(this.communityId());
      this.selectedModUser.set(null);
      this.selectedPermissions.set(new Set());
      this.modSearchQuery = '';
    } catch (err: any) {
      alert(err?.message || 'Failed to add moderator');
    } finally {
      this.addingMod.set(false);
    }
  }

  async removeModerator(userId: number | undefined) {
    if (!userId) return;
    if (!confirm('Remove this moderator?')) return;
    try {
      await firstValueFrom(this.communityFacade.removeModerator(this.communityId(), userId));
      await this.loadData(this.communityId());
    } catch (err: any) {
      alert(err?.message || 'Failed to remove moderator');
    }
  }

  openBanModal(member: CommunityMemberUI) {
    this.banTarget.set(member);
    this.banReason = '';
    this.showBanModal.set(true);
  }

  async executeBan() {
    const target = this.banTarget();
    if (!target) return;
    this.actionLoading.set(true);
    try {
      await firstValueFrom(this.communityFacade.banMember(this.communityId(), target.userId, this.banReason));
      this.members.update(list => list.filter(m => m.userId !== target.userId));
      this.showBanModal.set(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to ban member');
    } finally {
      this.actionLoading.set(false);
    }
  }

  openWarnModal(member: CommunityMemberUI) {
    this.warnTarget.set(member);
    this.warnReason = '';
    this.showWarnModal.set(true);
  }

  async executeWarn() {
    const target = this.warnTarget();
    if (!target) return;
    this.actionLoading.set(true);
    try {
      await firstValueFrom(this.communityFacade.warnMember(this.communityId(), target.userId, this.warnReason));
      this.members.update(list => list.map(m => m.userId === target.userId ? { ...m, warningCount: m.warningCount + 1 } : m));
      this.showWarnModal.set(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to warn member');
    } finally {
      this.actionLoading.set(false);
    }
  }

  async moderatorDeletePost(postId: number) {
    if (!confirm('Delete this post as moderator?')) return;
    try {
      await firstValueFrom(this.http.delete(`http://localhost:8081/api/posts/${postId}/moderate`));
      this.posts.update(list => list.filter(p => p.id !== postId));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete post');
    }
  }

  async transferOwnership() {
    if (!this.transferToUserId) return;
    if (!confirm('Transfer ownership? You will lose owner privileges.')) return;
    try {
      await firstValueFrom(this.communityFacade.transferOwnership(this.communityId(), this.transferToUserId));
      await this.loadData(this.communityId());
    } catch (err: any) {
      alert(err?.message || 'Failed to transfer ownership');
    }
  }

  confirmDelete() { this.showDeleteModal.set(true); }
  closeDeleteModal() { this.showDeleteModal.set(false); }

  async executeDelete() {
    this.deletingCommunity.set(true);
    try {
      await firstValueFrom(this.communityFacade.delete(this.communityId()));
      this.router.navigate(['/dashboard/client/my-created']);
    } catch (err: any) {
      alert('Failed to delete: ' + (err.message || 'Unknown error'));
    } finally {
      this.deletingCommunity.set(false);
    }
  }

  goBack() { this.router.navigate(['/dashboard/client/communities']); }
  openCreatePost() { this.createPostModal.open(); }
  onPostCreated() { this.loadPosts(this.communityId()); }

  async toggleLike(post: PostUI) {
    try {
      await firstValueFrom(this.postFacade.toggleLike(post.id));
      post.isLiked = !post.isLiked;
      post.likeCount += post.isLiked ? 1 : -1;
      this.posts.set([...this.posts()]);
    } catch (e) { console.error(e); }
  }

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  getTimeAgo(date: Date | null): string {
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