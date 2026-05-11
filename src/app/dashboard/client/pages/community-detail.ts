import { Component, inject, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { CommunityFacadeService, CommunityMemberUI, PostFacadeService, CommunityUI, PostUI } from '../../../api/facades';
import { UserContextService } from '../../../services/user-context.service';
import { CreatePostModalComponent } from '../modals/create-post';
import { PostCardComponent } from '../modals/posts';

const ALL_PERMISSIONS = [
  'EDIT_COMMUNITY', 'ADD_MODERATOR', 'REMOVE_MODERATOR',
  'VIEW_MEMBERS', 'BAN_MEMBER', 'WARN_MEMBER',
  'DELETE_POST', 'DELETE_COMMENT', 'APPROVE_POST'
];

@Component({
  selector: 'app-community-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CreatePostModalComponent, PostCardComponent],
  template: `
    <app-create-post-modal #createPostModal [prefilledCommunityId]="communityId()" (postCreated)="onPostCreated()" />

    <div class="flex flex-col gap-6 max-w-4xl mx-auto pb-10">

      <!-- Back Button -->
      <button (click)="goBack()" class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium w-fit">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Communities
      </button>

      <!-- Loading -->
      @if (loading()) {
        <div class="p-10 flex justify-center">
          <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>

      <!-- Error -->
      } @else if (error()) {
        <div class="p-10 text-center bg-white rounded-2xl border border-red-200">
          <h2 class="text-xl font-bold text-slate-900">Community Not Found</h2>
          <p class="mt-2 text-slate-500">{{ error() }}</p>
          <button (click)="goBack()" class="mt-6 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl">Go Back</button>
        </div>

      <!-- Main Content -->
      } @else if (community()) {

        <!-- Banner Header -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500"></div>
          <div class="px-6 sm:px-8 pb-6">

            <!-- Title + Actions Row -->
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
              <div class="flex items-end gap-5">
                <div class="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center flex-shrink-0 text-3xl font-bold text-indigo-600">
                  {{ getInitials(community()!.title) }}
                </div>
                <div class="mb-1">
                  <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">{{ community()!.title }}</h1>
                  <p class="text-slate-500 font-medium mt-1">
                    c/{{ community()!.title.toLowerCase().replace(' ', '') }} •
                    {{ community()!.nbrMembers }} {{ community()!.nbrMembers === 1 ? 'member' : 'members' }}
                  </p>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3 mb-1 flex-wrap">
                @if (isOwner()) {
                  <button (click)="activeTab.set('pending'); loadPendingPosts()" class="px-4 py-2 bg-amber-50 text-amber-700 font-semibold rounded-xl hover:bg-amber-100 transition-colors border border-amber-200 relative">
                    Pending
                    @if (pendingPosts().length > 0) {
                      <span class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {{ pendingPosts().length }}
                      </span>
                    }
                  </button>
                  <button (click)="activeTab.set('settings'); loadSettingsData()" class="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
                    ⚙ Settings
                  </button>
                  <button (click)="confirmDelete()" class="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors border border-red-200">
                    Delete
                  </button>
                } @else if (isModerator()) {
                  @if (canApprovePosts()) {
                    <button (click)="activeTab.set('pending'); loadPendingPosts()" class="px-4 py-2 bg-amber-50 text-amber-700 font-semibold rounded-xl hover:bg-amber-100 transition-colors border border-amber-200 relative">
                      Pending
                      @if (pendingPosts().length > 0) {
                        <span class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {{ pendingPosts().length }}
                        </span>
                      }
                    </button>
                  }
                  <button (click)="activeTab.set('settings'); loadSettingsData()" class="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">
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

            <!-- About + Members Preview -->
            <div class="mt-6">
              @if (previewMembers().length > 0) {
                <div class="flex items-center gap-3 mb-4">
                  <div class="flex -space-x-2">
                    @for (m of previewMembers(); track m.userId) {
                      @if (m.pfp) {
                        <img [src]="'http://localhost:8081/uploads/' + m.pfp" [title]="m.fullName" class="w-8 h-8 rounded-full object-cover border-2 border-white" />
                      } @else {
                        <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold border-2 border-white select-none" [title]="m.fullName">
                          {{ getInitials(m.fullName) }}
                        </div>
                      }
                    }
                  </div>
                  <button (click)="openMembersModal()" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                    View all {{ community()!.nbrMembers }} {{ community()!.nbrMembers === 1 ? 'member' : 'members' }}
                  </button>
                </div>
              }
              <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">About Community</h3>
              <p class="text-slate-700 leading-relaxed whitespace-pre-line">{{ community()!.description }}</p>
              @if (community()!.category) {
                <span class="mt-2 inline-block text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {{ community()!.category }}
                </span>
              }
            </div>
          </div>
        </div>

        <!-- ==================== TAB NAV ==================== -->
        <div class="flex gap-2">
          <button
            (click)="activeTab.set('feed')"
            class="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            [class.bg-indigo-600]="activeTab() === 'feed'"
            [class.text-white]="activeTab() === 'feed'"
            [class.bg-slate-100]="activeTab() !== 'feed'"
            [class.text-slate-600]="activeTab() !== 'feed'"
          >Feed</button>
          @if (isOwner() || canApprovePosts()) {
            <button
              (click)="activeTab.set('pending'); loadPendingPosts()"
              class="px-4 py-2 rounded-xl text-sm font-semibold transition-colors relative"
              [class.bg-amber-500]="activeTab() === 'pending'"
              [class.text-white]="activeTab() === 'pending'"
              [class.bg-slate-100]="activeTab() !== 'pending'"
              [class.text-slate-600]="activeTab() !== 'pending'"
            >
              Pending
              @if (pendingPosts().length > 0) {
                <span class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {{ pendingPosts().length }}
                </span>
              }
            </button>
          }
          @if (isOwner() || isModerator()) {
            <button
              (click)="activeTab.set('settings'); loadSettingsData()"
              class="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              [class.bg-indigo-600]="activeTab() === 'settings'"
              [class.text-white]="activeTab() === 'settings'"
              [class.bg-slate-100]="activeTab() !== 'settings'"
              [class.text-slate-600]="activeTab() !== 'settings'"
            >Settings</button>
          }
        </div>

        <!-- ==================== FEED TAB ==================== -->
        @if (activeTab() === 'feed') {

          @if (isMember() || isOwner() || isModerator()) {
            <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm select-none">
                {{ getInitials((userContext.user()?.firstName ?? '') + ' ' + (userContext.user()?.lastName ?? '')) }}
              </div>
              <button (click)="openCreatePost()" class="flex-1 text-left bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-full px-4 py-2.5 text-slate-400 hover:text-indigo-500 focus:outline-none transition-all duration-200 text-sm font-medium">
                What's on your mind? Share with the community...
              </button>
              <button (click)="openCreatePost()" class="flex-shrink-0 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-full hover:bg-indigo-700 transition-colors shadow-sm">
                Post
              </button>
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
                  <app-post-card
                    [post]="post"
                    [showLike]="true"
                    [showComments]="true"
                    [showReport]="true"
                    [showCommunity]="false"
                    [canDeletePost]="canModeratePost()"
                    [canDeleteComment]="canModerateComment()"
                    (postDeleted)="onPostDeleted($event)"
                  />
                }
              </div>
            }
          </div>
        }

        <!-- ==================== PENDING TAB ==================== -->
        @if (activeTab() === 'pending') {
          <div class="flex flex-col gap-4">
            <h2 class="text-xl font-bold text-slate-900 px-1">Pending Posts</h2>

            @if (pendingLoading()) {
              <div class="p-10 flex justify-center">
                <div class="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
              </div>
            } @else if (pendingPosts().length === 0) {
              <div class="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <div class="text-4xl mb-3">✅</div>
                <h3 class="text-lg font-semibold text-slate-900">No pending posts</h3>
                <p class="text-slate-500 mt-1">All caught up!</p>
              </div>
            } @else {
              <div class="divide-y divide-slate-100 bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                @for (post of pendingPosts(); track post.id) {
                  <app-post-card
                    [post]="post"
                    [showLike]="false"
                    [showComments]="false"
                    [showReport]="false"
                    [showCommunity]="false"
                    [showApprove]="true"
                    (postApproved)="onPostApproved($event, post)"
                    (postRejected)="onPostRejected($event)"
                  />
                }
              </div>
            }
          </div>
        }

        <!-- ==================== SETTINGS TAB ==================== -->
        @if (activeTab() === 'settings') {
          <div class="flex flex-col gap-6">

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

            @if (isOwner() || hasPermission('ADD_MODERATOR')) {
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-4">Moderators</h3>
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
                @if (isOwner()) {
                  <div class="border-t border-slate-100 pt-4">
                    <h4 class="text-sm font-bold text-slate-700 mb-3">Add Moderator</h4>
                    <input type="text" [(ngModel)]="modSearchQuery" (input)="searchUsers()" placeholder="Search by username..." class="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-3" />
                    @if (userSearchResults().length > 0) {
                      <div class="border border-slate-200 rounded-xl overflow-hidden mb-3">
                        @for (user of userSearchResults(); track user.id) {
                          <button (click)="selectUserForMod(user)" class="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0">
                            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {{ getInitials(user.firstName + ' ' + user.lastName) }}
                            </div>
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
                      <div (click)="navigateToProfile(member.userId)" class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-colors">
                        <div  class="flex items-center gap-3">
                          @if (member.pfp) {
                            <img [src]="'http://localhost:8081/uploads/' + member.pfp" class="w-9 h-9 rounded-full object-cover flex-shrink-0"  />
                          } @else {
                            <div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {{ getInitials(member.fullName) }}
                            </div>
                          }
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
                          @if (canWarnMember(member)) {
                            <button (click)="$event.stopPropagation(); openWarnModal(member)" class="text-xs px-2 py-1 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200">Warn</button>
                          }
                          @if (canBanMember(member)) {
                            <button (click)="$event.stopPropagation(); openBanModal(member)" class="text-xs px-2 py-1 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200">Ban</button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            @if (isOwner() || hasPermission('BAN_MEMBER')) {
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-4">Banned Members</h3>
                @if (bannedLoading()) {
                  <div class="flex justify-center py-4">
                    <div class="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  </div>
                } @else if (bannedMembers().length === 0) {
                  <p class="text-sm text-slate-400">No banned members.</p>
                } @else {
                  <div class="space-y-3">
                    @for (member of bannedMembers(); track member.userId) {
                      <div class="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                        <div class="flex items-center gap-3">
                          @if (member.pfp) {
                            <img [src]="'http://localhost:8081/uploads/' + member.pfp" class="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                          } @else {
                            <div class="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {{ getInitials(member.fullName) }}
                            </div>
                          }
                          <div>
                            <p class="text-sm font-semibold text-slate-900">{{ member.fullName }}</p>
                            <p class="text-xs text-slate-500">&#64;{{ member.username }}</p>
                          </div>
                        </div>
                        <button (click)="unbanMember(member.userId)" class="text-xs px-2 py-1 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200">Unban</button>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            @if (isOwner()) {
              <div class="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
                <h3 class="text-lg font-bold text-red-700 mb-2">Danger Zone</h3>
                <p class="text-sm text-slate-500 mb-4">Transfer ownership to another member. You will lose owner privileges.</p>
                <input type="text" [(ngModel)]="transferSearchQuery" (input)="searchTransferUsers()" placeholder="Search by username..." class="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-400 focus:outline-none mb-3" />
                @if (transferSearchResults().length > 0) {
                  <div class="border border-slate-200 rounded-xl overflow-hidden mb-3">
                    @for (user of transferSearchResults(); track user.id) {
                      <button (click)="selectTransferUser(user)" class="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0">
                        <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {{ getInitials(user.firstName + ' ' + user.lastName) }}
                        </div>
                        <div>
                          <p class="text-sm font-medium text-slate-900">{{ user.firstName }} {{ user.lastName }}</p>
                          <p class="text-xs text-slate-500">&#64;{{ user.username }}</p>
                        </div>
                      </button>
                    }
                  </div>
                }
                @if (selectedTransferUser()) {
                  <div class="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                    <p class="text-sm font-semibold text-red-900">Transfer to: {{ selectedTransferUser()!.firstName }} {{ selectedTransferUser()!.lastName }}</p>
                    <p class="text-xs text-red-600">&#64;{{ selectedTransferUser()!.username }}</p>
                  </div>
                  <button (click)="transferOwnership()" class="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">Confirm Transfer</button>
                }
              </div>
            }
          </div>
        }
      }
    </div>

    <!-- ==================== MODALS ==================== -->

    <!-- Members Modal -->
    @if (showMembersModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-900">Members · {{ community()!.nbrMembers }}</h2>
            <button (click)="showMembersModal.set(false)" class="text-slate-400 hover:text-slate-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="overflow-y-auto p-4">
            @if (allMembersLoading()) {
              <div class="flex justify-center py-6">
                <div class="w-6 h-6 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            } @else if (allMembersForModal().length === 0) {
              <p class="text-sm text-slate-400 text-center py-4">No members found.</p>
            } @else {
              <div class="space-y-3">
                @for (member of allMembersForModal(); track member.userId) {
                  <div (click)="navigateToProfile(member.userId); showMembersModal.set(false)" class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-indigo-50 transition-colors">
                    @if (member.pfp) {
                      <img  [src]="'http://localhost:8081/uploads/' + member.pfp" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    } @else {
                      <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm select-none flex-shrink-0">
                        {{ getInitials(member.fullName) }}
                      </div>
                    }
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-slate-900 truncate">{{ member.fullName }}</p>
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-xs text-slate-500">&#64;{{ member.username }}</p>
                        @if (member.userId === community()!.ownerId) {
                          <span class="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">Owner</span>
                        }
                        @if (member.isModerator) {
                          <span class="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Mod</span>
                        }
                      </div>
                    </div>
                    <span class="text-xs text-slate-400 flex-shrink-0">Lv {{ member.level }}</span>
                  </div>
                }
              </div>
              @if (allMembersPage() < allMembersTotalPages() - 1) {
                <div class="mt-4 text-center">
                  <button (click)="loadMoreModalMembers()" [disabled]="allMembersLoadingMore()" class="px-4 py-2 text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors disabled:opacity-50">
                    @if (allMembersLoadingMore()) {
                      <svg class="w-4 h-4 animate-spin inline mr-1" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Loading...
                    } @else { Load more members }
                  </button>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }

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
          <p class="text-sm text-slate-500 mb-4">They will be removed and cannot rejoin.</p>
          <textarea [(ngModel)]="banReason" placeholder="Reason for ban..." rows="3" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:outline-none mb-4 resize-none"></textarea>
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
          <p class="text-sm text-slate-500 mb-4">After 3 warnings they will be auto-banned.</p>
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

    <!-- Reject Post Confirm Modal -->
    @if (rejectPostConfirm()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h2 class="text-xl font-bold text-slate-900 mb-2">Reject Post?</h2>
          <p class="text-slate-600 mb-6">Reject and delete "{{ rejectPostConfirm()!.title }}"? This cannot be undone.</p>
          <div class="flex gap-3">
            <button (click)="rejectPostConfirm.set(null)" class="flex-1 px-4 py-2 border rounded-xl font-semibold hover:bg-slate-50">Cancel</button>
            <button (click)="confirmRejectPost()" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Reject</button>
          </div>
        </div>
      </div>
    }

    <!-- Remove Moderator Confirm Modal -->
    @if (removingModId()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h2 class="text-xl font-bold text-slate-900 mb-2">Remove Moderator?</h2>
          <p class="text-slate-600 mb-6">This will revoke all moderator permissions for this user.</p>
          <div class="flex gap-3">
            <button (click)="removingModId.set(null)" class="flex-1 px-4 py-2 border rounded-xl font-semibold hover:bg-slate-50">Cancel</button>
            <button (click)="confirmRemoveModerator()" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Remove</button>
          </div>
        </div>
      </div>
    }

    <!-- Transfer Ownership Confirm Modal -->
    @if (showTransferConfirm()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h2 class="text-xl font-bold text-slate-900 mb-2">Transfer Ownership?</h2>
          <p class="text-slate-600 mb-6">Transfer to {{ selectedTransferUser()?.firstName }} {{ selectedTransferUser()?.lastName }}? You will lose owner privileges.</p>
          <div class="flex gap-3">
            <button (click)="showTransferConfirm.set(false)" class="flex-1 px-4 py-2 border rounded-xl font-semibold hover:bg-slate-50">Cancel</button>
            <button (click)="confirmTransferOwnership()" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Confirm Transfer</button>
          </div>
        </div>
      </div>
    }

    <!-- Toast -->
    @if (toastMessage()) {
      <div class="fixed top-5 right-5 z-[100] px-5 py-3 bg-slate-800 text-white rounded-xl shadow-lg text-sm font-medium animate-[slideDown_0.2s_ease]">
        {{ toastMessage() }}
      </div>
    }
  `
})
export class CommunityDetailComponent implements OnInit {
  @ViewChild('createPostModal') createPostModal!: CreatePostModalComponent;

  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly communityFacade = inject(CommunityFacadeService);
  private readonly postFacade     = inject(PostFacadeService);
  readonly userContext             = inject(UserContextService);
  private readonly http           = inject(HttpClient);
  private readonly fb             = inject(FormBuilder);

  // Core state
  readonly communityId      = signal<number>(0);
  readonly community        = signal<CommunityUI | null>(null);
  readonly loading          = signal(true);
  readonly error            = signal<string | null>(null);
  readonly activeTab        = signal<'feed' | 'pending' | 'settings'>('feed');
  private readonly _isMember = signal(false);

  // Posts
  readonly posts        = signal<PostUI[]>([]);
  readonly postsLoading = signal(true);

  // Pending Posts
  readonly pendingPosts      = signal<PostUI[]>([]);
  readonly pendingLoading    = signal(false);
  readonly pendingActionIds  = signal<Set<number>>(new Set());

  // Members
  readonly members        = signal<CommunityMemberUI[]>([]);
  readonly membersLoading = signal(false);
  readonly previewMembers = signal<CommunityMemberUI[]>([]);
  readonly bannedMembers  = signal<CommunityMemberUI[]>([]);
  readonly bannedLoading  = signal(false);

  // Members Modal
  readonly showMembersModal      = signal(false);
  readonly allMembersForModal    = signal<CommunityMemberUI[]>([]);
  readonly allMembersLoading     = signal(false);
  readonly allMembersPage        = signal(0);
  readonly allMembersTotalPages  = signal(0);
  readonly allMembersLoadingMore = signal(false);

  // Moderator Management
  readonly userSearchResults  = signal<any[]>([]);
  readonly selectedModUser    = signal<any | null>(null);
  readonly selectedPermissions = signal<Set<string>>(new Set());
  readonly addingMod          = signal(false);
  readonly removingModId      = signal<number | null>(null);

  // Transfer Ownership
  readonly transferSearchResults = signal<any[]>([]);
  readonly selectedTransferUser  = signal<any | null>(null);
  readonly showTransferConfirm   = signal(false);

  // Modals
  readonly showDeleteModal    = signal(false);
  readonly deletingCommunity  = signal(false);
  readonly showBanModal       = signal(false);
  readonly showWarnModal      = signal(false);
  readonly banTarget          = signal<CommunityMemberUI | null>(null);
  readonly warnTarget         = signal<CommunityMemberUI | null>(null);
  readonly actionLoading      = signal(false);
  readonly savingEdit         = signal(false);
  readonly toastMessage       = signal<string | null>(null);
  readonly rejectPostConfirm  = signal<PostUI | null>(null);

  // Form inputs
  banReason         = '';
  warnReason        = '';
  modSearchQuery    = '';
  transferSearchQuery = '';
  allPermissions    = ALL_PERMISSIONS;

  readonly editForm = this.fb.nonNullable.group({
    title:       ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category:    ['']
  });

  // ==================== COMPUTED ====================

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

  readonly isMember         = computed(() => this._isMember());
  readonly canModeratePost  = computed(() => this.isOwner() || this.hasPermission('DELETE_POST'));
  readonly canModerateComment = computed(() => this.isOwner() || this.hasPermission('DELETE_COMMENT'));
  readonly canApprovePosts  = computed(() => this.hasPermission('APPROVE_POST'));

  // ==================== PERMISSION HELPERS ====================

  hasPermission(perm: string): boolean {
    const user = this.userContext.user();
    const comm = this.community();
    if (!user || !comm) return false;
    const mod = (comm.moderators ?? []).find(m => m.userId === user.id);
    return mod?.permissions?.includes(perm) ?? false;
  }

  canBanMember(member: CommunityMemberUI): boolean {
    const user = this.userContext.user();
    if (!user) return false;
    if (member.userId === user.id) return false;
    if (member.userId === this.community()?.ownerId) return false;
    if (this.isOwner()) return true;
    if (member.isModerator) return false;
    return this.hasPermission('BAN_MEMBER');
  }

  canWarnMember(member: CommunityMemberUI): boolean {
    const user = this.userContext.user();
    if (!user) return false;
    if (member.userId === user.id) return false;
    if (member.userId === this.community()?.ownerId) return false;
    if (this.isOwner()) return true;
    if (member.isModerator) return false;
    return this.hasPermission('WARN_MEMBER');
  }

  // ==================== LIFECYCLE ====================

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

  // ==================== DATA LOADING ====================

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
    await this.loadPreviewMembers(id);
  }

  async checkMembership(communityId: number) {
    try {
      const result = await firstValueFrom(this.communityFacade.getMy({ size: 100 }));
      this._isMember.set(result.items.some(c => c.id === communityId));
    } catch { this._isMember.set(false); }
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

  async loadPendingPosts() {
    this.pendingLoading.set(true);
    try {
      const posts = await firstValueFrom(this.postFacade.getPendingPosts(this.communityId()));
      this.pendingPosts.set(posts);
    } catch (err: any) {
      console.error('Failed to load pending posts', err);
    } finally {
      this.pendingLoading.set(false);
    }
  }

  async loadPreviewMembers(communityId: number): Promise<void> {
    try {
      const list = await firstValueFrom(this.communityFacade.getMembersPreview(communityId));
      this.previewMembers.set(list);
    } catch { this.previewMembers.set([]); }
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
    await this.loadBannedMembers();
  }

  async loadBannedMembers(): Promise<void> {
    if (!this.isOwner() && !this.hasPermission('BAN_MEMBER')) return;
    this.bannedLoading.set(true);
    try {
      const list = await firstValueFrom(this.communityFacade.getBannedMembers(this.communityId()));
      this.bannedMembers.set(list);
    } catch (err) {
      console.error('Failed to load banned members', err);
    } finally {
      this.bannedLoading.set(false);
    }
  }

  // ==================== POST CARD EVENTS ====================

  onPostDeleted(postId: number): void {
    this.posts.update(list => list.filter(p => p.id !== postId));
  }

  onPostApproved(postId: number, post: PostUI): void {
    this.pendingPosts.update(list => list.filter(p => p.id !== postId));
    this.posts.update(list => [{ ...post, status: 'Approved' }, ...list]);
  }

  onPostRejected(postId: number): void {
    this.pendingPosts.update(list => list.filter(p => p.id !== postId));
  }

  // ==================== PENDING POSTS ====================

  async rejectPost(post: PostUI) { this.rejectPostConfirm.set(post); }

  async confirmRejectPost() {
    const post = this.rejectPostConfirm();
    if (!post) return;
    this.rejectPostConfirm.set(null);
    this.pendingActionIds.update(s => new Set(s).add(post.id));
    try {
      await firstValueFrom(this.postFacade.reject(post.id));
      this.pendingPosts.update(list => list.filter(p => p.id !== post.id));
    } catch (err: any) {
      this.showToast(err?.message || 'Failed to reject post');
    } finally {
      this.pendingActionIds.update(s => { const n = new Set(s); n.delete(post.id); return n; });
    }
  }

  // ==================== MEMBERS MODAL ====================

  async openMembersModal(): Promise<void> {
    this.showMembersModal.set(true);
    this.allMembersPage.set(0);
    this.allMembersForModal.set([]);
    this.allMembersLoading.set(true);
    try {
      const result = await firstValueFrom(this.communityFacade.getMembersPublic(this.communityId(), 0, 5));
      this.allMembersForModal.set(result.items);
      this.allMembersTotalPages.set(result.totalPages);
    } catch (err) {
      console.error('Failed to load members for modal', err);
    } finally {
      this.allMembersLoading.set(false);
    }
  }

  async loadMoreModalMembers(): Promise<void> {
    if (this.allMembersLoadingMore()) return;
    this.allMembersLoadingMore.set(true);
    try {
      const nextPage = this.allMembersPage() + 1;
      const result = await firstValueFrom(this.communityFacade.getMembersPublic(this.communityId(), nextPage, 5));
      this.allMembersForModal.update(current => [...current, ...result.items]);
      this.allMembersPage.set(nextPage);
      this.allMembersTotalPages.set(result.totalPages);
    } catch (err) {
      console.error('Failed to load more members', err);
    } finally {
      this.allMembersLoadingMore.set(false);
    }
  }
  

  // ==================== JOIN / LEAVE ====================

  async joinCommunity() {
    try {
      await firstValueFrom(this.communityFacade.join(this.communityId()));
      this._isMember.set(true);
      this.community.update(c => c ? { ...c, nbrMembers: c.nbrMembers + 1 } : c);
    } catch (err: any) { this.showToast(err?.message || 'Failed to join community'); }
  }

  async leaveCommunity() {
    try {
      await firstValueFrom(this.communityFacade.leave(this.communityId()));
      this._isMember.set(false);
      this.community.update(c => c ? { ...c, nbrMembers: Math.max(0, c.nbrMembers - 1) } : c);
    } catch (err: any) { this.showToast(err?.message || 'Failed to leave community'); }
  }

  // ==================== SETTINGS ====================

  async saveEdit() {
    if (this.editForm.invalid) return;
    this.savingEdit.set(true);
    try {
      const vals = this.editForm.getRawValue();
      const updated = await firstValueFrom(this.communityFacade.update(this.communityId(), {
        title: vals.title, description: vals.description, category: vals.category ?? ''
      }));
      this.community.set(updated);
    } catch (err: any) {
      this.showToast('Failed to update: ' + (err.message || 'Unknown error'));
    } finally {
      this.savingEdit.set(false);
    }
  }

  // ==================== MODERATOR MANAGEMENT ====================

  async searchUsers() {
    const q = this.modSearchQuery.trim().toLowerCase();
    if (!q || q.length < 2) { this.userSearchResults.set([]); return; }
    const memberList = this.members();
    if (memberList.length > 0) {
      const filtered = memberList
        .filter(m => !m.isModerator && m.userId !== this.community()?.ownerId)
        .filter(m => (m.username ?? '').toLowerCase().includes(q) || (m.fullName ?? '').toLowerCase().includes(q))
        .slice(0, 5)
        .map(m => ({ id: m.userId, firstName: m.fullName?.split(' ')[0] ?? '', lastName: m.fullName?.split(' ').slice(1).join(' ') ?? '', username: m.username }));
      this.userSearchResults.set(filtered);
    } else {
      try {
        const result: any = await firstValueFrom(this.http.get(`http://localhost:8081/api/clients/search?username=${encodeURIComponent(this.modSearchQuery)}&size=5`));
        this.userSearchResults.set(result.content ?? []);
      } catch { this.userSearchResults.set([]); }
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
      await firstValueFrom(this.communityFacade.addModerator(this.communityId(), user.id, [...this.selectedPermissions()]));
      await this.loadData(this.communityId());
      this.selectedModUser.set(null);
      this.selectedPermissions.set(new Set());
      this.modSearchQuery = '';
    } catch (err: any) {
      this.showToast(err?.message || 'Failed to add moderator');
    } finally {
      this.addingMod.set(false);
    }
  }

  async removeModerator(userId: number | undefined) {
    if (!userId) return;
    this.removingModId.set(userId);
  }

  async confirmRemoveModerator() {
    const userId = this.removingModId();
    if (!userId) return;
    this.removingModId.set(null);
    try {
      await firstValueFrom(this.communityFacade.removeModerator(this.communityId(), userId));
      await this.loadData(this.communityId());
    } catch (err: any) { this.showToast(err?.message || 'Failed to remove moderator'); }
  }

  // ==================== TRANSFER OWNERSHIP ====================

  async searchTransferUsers() {
    if (!this.transferSearchQuery.trim() || this.transferSearchQuery.length < 2) { this.transferSearchResults.set([]); return; }
    try {
      const result: any = await firstValueFrom(this.http.get(`http://localhost:8081/api/clients/search?username=${encodeURIComponent(this.transferSearchQuery)}&size=5`));
      this.transferSearchResults.set(result.content ?? []);
    } catch { this.transferSearchResults.set([]); }
  }

  selectTransferUser(user: any) {
    this.selectedTransferUser.set(user);
    this.transferSearchResults.set([]);
    this.transferSearchQuery = user.username;
  }

  async transferOwnership() {
    if (!this.selectedTransferUser()) return;
    this.showTransferConfirm.set(true);
  }

  async confirmTransferOwnership() {
    const target = this.selectedTransferUser();
    if (!target) return;
    this.showTransferConfirm.set(false);
    try {
      await firstValueFrom(this.communityFacade.transferOwnership(this.communityId(), target.id));
      await this.loadData(this.communityId());
      this.selectedTransferUser.set(null);
      this.transferSearchQuery = '';
    } catch (err: any) { this.showToast(err?.message || 'Failed to transfer ownership'); }
  }

  // ==================== BAN / WARN ====================

  openBanModal(member: CommunityMemberUI) { this.banTarget.set(member); this.banReason = ''; this.showBanModal.set(true); }

  async executeBan() {
    const target = this.banTarget();
    if (!target) return;
    this.actionLoading.set(true);
    try {
      await firstValueFrom(this.communityFacade.banMember(this.communityId(), target.userId, this.banReason));
      this.members.update(list => list.filter(m => m.userId !== target.userId));
      this.showBanModal.set(false);
    } catch (err: any) {
      this.showToast(err?.message || 'Failed to ban member');
    } finally {
      this.actionLoading.set(false);
    }
  }

  openWarnModal(member: CommunityMemberUI) { this.warnTarget.set(member); this.warnReason = ''; this.showWarnModal.set(true); }

  async executeWarn() {
    const target = this.warnTarget();
    if (!target) return;
    this.actionLoading.set(true);
    try {
      await firstValueFrom(this.communityFacade.warnMember(this.communityId(), target.userId, this.warnReason));
      const newWarningCount = (target.warningCount ?? 0) + 1;
      this.members.update(list => list.map(m => m.userId === target.userId ? { ...m, warningCount: newWarningCount } : m));
      this.showWarnModal.set(false);
      if (newWarningCount >= 3) {
        try {
          await firstValueFrom(this.communityFacade.banMember(this.communityId(), target.userId, 'Auto-banned after 3 warnings'));
          this.members.update(list => list.filter(m => m.userId !== target.userId));
          this.bannedMembers.update(list => [{ ...target, warningCount: newWarningCount }, ...list]);
          this.showToast('Member auto-banned after 3 warnings');
        } catch (banErr: any) { console.error('Auto-ban failed:', banErr); }
      }
    } catch (err: any) {
      this.showToast(err?.message || 'Failed to warn member');
    } finally {
      this.actionLoading.set(false);
    }
  }

  async unbanMember(userId: number): Promise<void> {
    try {
      await firstValueFrom(this.communityFacade.unbanMember(this.communityId(), userId));
      this.bannedMembers.update(list => list.filter(m => m.userId !== userId));
    } catch (err: any) { this.showToast(err?.message || 'Failed to unban member'); }
  }

  // ==================== DELETE COMMUNITY ====================

  confirmDelete()  { this.showDeleteModal.set(true); }
  closeDeleteModal() { this.showDeleteModal.set(false); }

  async executeDelete() {
    this.deletingCommunity.set(true);
    try {
      await firstValueFrom(this.communityFacade.delete(this.communityId()));
      this.router.navigate(['/dashboard/client/my-created']);
    } catch (err: any) {
      this.showToast('Failed to delete: ' + (err.message || 'Unknown error'));
    } finally {
      this.deletingCommunity.set(false);
    }
  }

  // ==================== UTILS ====================

  goBack() { this.router.navigate(['/dashboard/client/communities']); }
  openCreatePost() { this.createPostModal.open(); }
  onPostCreated() { this.loadPosts(this.communityId()); }

  navigateToProfile(userId?: number): void {
    if (!userId) return;
    const currentUser = this.userContext.user();
    if (currentUser && userId == currentUser.id) {
      this.router.navigate(['/dashboard/client/profile']);
    } else {
      this.router.navigate(['/dashboard/client/profile', userId]);
    }
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 4000);
  }

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
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