import { Component, inject, OnInit, signal, effect, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { CommunityFacadeService, PostFacadeService, CommunityUI, PostUI } from '../../api/facades';
import { UserContextService } from '../../user-context.service';
import { FeedService } from '../../services/feed.service';
import { CreatePostModalComponent } from './create-post';

@Component({
  selector: 'app-community-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CreatePostModalComponent],
  template: `
    <app-create-post-modal #createPostModal [prefilledCommunityId]="communityId()" (postCreated)="onPostCreated()" />

    <div class="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
      
      <!-- Back Button -->
      <div>
        <button (click)="goBack()" class="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Communities
        </button>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="p-10 flex justify-center">
          <div class="flex flex-col items-center gap-4">
            <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p class="text-slate-500 font-medium">Loading community...</p>
          </div>
        </div>
      }

      <!-- Error State -->
      @else if (error()) {
        <div class="p-10 text-center bg-white rounded-2xl border border-red-200">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 class="text-xl font-bold text-slate-900">Community Not Found</h2>
          <p class="mt-2 text-slate-500">{{ error() }}</p>
          <button (click)="goBack()" class="mt-6 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">Go Back</button>
        </div>
      }

      <!-- Community Content -->
      @else if (community()) {
        <!-- Banner Header -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
          <!-- Colorful Banner background -->
          <div class="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500"></div>
          
          <div class="px-6 sm:px-8 pb-6">
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
              <div class="flex items-end gap-5">
                <!-- Avatar -->
                <div class="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center flex-shrink-0 text-3xl font-bold text-indigo-600">
                  {{ getInitials(community()!.title) }}
                </div>
                
                <div class="mb-1">
                  <h1 class="text-2xl sm:text-3xl font-bold text-slate-900">{{ community()!.title }}</h1>
                  <p class="text-slate-500 font-medium mt-1">c/{{ community()!.title.toLowerCase().replace(' ', '') }} • {{ community()!.nbrMembers }} members</p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 mb-1">
                @if (isModerator()) {
                  <button (click)="openEditModal()" class="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors shadow-sm border border-slate-200">Edit Community</button>
                  <button (click)="confirmDelete()" class="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors shadow-sm border border-red-200">Delete Community</button>
                } @else {
                  <button class="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">Join Community</button>
                }
              </div>
            </div>
            
            <div class="mt-6">
              <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">About Community</h3>
              <p class="text-slate-700 leading-relaxed whitespace-pre-line">{{ community()!.description }}</p>
            </div>
          </div>
        </div>

        <!-- Create Post Input (Fake input that opens modal) -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4">
           <div class="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0"></div>
           <input 
             type="text" 
             readonly 
             (click)="openCreatePost()"
             placeholder="Create a post in c/{{ community()!.title.toLowerCase().replace(' ', '') }}..." 
             class="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-full px-4 py-2.5 cursor-text text-slate-600 focus:outline-none transition-colors"
           />
        </div>

        <!-- Feed Section -->
        <div class="flex flex-col gap-4">
          <h2 class="text-xl font-bold text-slate-900 px-1">Community Feed</h2>
          
          @if (postsLoading()) {
            <div class="p-10 flex justify-center">
              <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          } @else if (posts().length === 0) {
            <div class="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <div class="inline-flex justify-center items-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5L17.5 4.5l-2.5 2.5H19" /></svg>
              </div>
              <h3 class="text-lg font-semibold text-slate-900">No posts yet</h3>
              <p class="text-slate-500 mt-1 mb-4">Be the first to share something in this community!</p>
              <button (click)="openCreatePost()" class="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">Create Post</button>
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
                        <span class="text-xs text-slate-400">{{ getTimeAgo(post.createdAt) }}</span>
                      </div>
                    </div>
                  </div>
                  <h3 class="font-bold text-slate-900 mb-2">{{ post.title }}</h3>
                  <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{{ post.content }}</p>

                  <!-- Post images -->
                  @if (post.images.length > 0) {
                    <div class="mt-3">
                      <div
                        class="rounded-xl overflow-hidden"
                        [class.grid]="post.images.length > 1"
                        [class.grid-cols-2]="post.images.length > 1"
                        [class.gap-0.5]="post.images.length > 1"
                      >
                        @for (img of post.images.slice(0, 4); track img; let i = $index) {
                          <div
                            class="relative bg-slate-100 overflow-hidden"
                            [class.aspect-video]="post.images.length === 1"
                            [class.aspect-square]="post.images.length > 1"
                          >
                            <img
                              [src]="'http://localhost:8081/uploads/' + img"
                              [alt]="post.title"
                              class="w-full h-full object-cover"
                            />
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
                  <div class="mt-4 flex items-center gap-4">
                    <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors" [class.text-rose-600]="post.isLiked" [class.bg-rose-50]="post.isLiked" (click)="toggleLike(post)">
                      <svg class="w-4 h-4" [attr.fill]="post.isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      {{ post.likeCount }}
                    </button>
                    <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      {{ post.commentCount }}
                    </button>
                  </div>
                </article>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Edit Modal (Simple overlay for now) -->
    @if (showEditModal()) {
      <div class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full">
          <div class="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <h2 class="text-xl font-bold">Edit Community</h2>
            <button (click)="closeEditModal()" class="text-slate-400 hover:text-slate-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-2">Community Name</label>
              <input type="text" formControlName="title" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-2">Description</label>
              <textarea formControlName="description" rows="4" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"></textarea>
            </div>
            <div class="flex gap-3 pt-4">
              <button type="button" (click)="closeEditModal()" class="flex-1 px-4 py-2 border rounded-lg font-medium hover:bg-slate-50">Cancel</button>
              <button type="submit" [disabled]="editForm.invalid || savingEdit()" class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
                {{ savingEdit() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (showDeleteModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          <div class="p-6">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-slate-900">Delete Community?</h2>
            </div>
            <p class="text-slate-600 mb-6">
              Are you sure you want to delete <span class="font-semibold text-slate-900">c/{{ community()?.title?.toLowerCase()?.replace(' ', '') }}</span>? 
              This action cannot be undone and all posts will be permanently removed.
            </p>
            <div class="flex gap-3">
              <button 
                type="button" 
                (click)="closeDeleteModal()" 
                [disabled]="deletingCommunity()"
                class="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="button" 
                (click)="executeDelete()" 
                [disabled]="deletingCommunity()"
                class="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {{ deletingCommunity() ? 'Deleting...' : 'Yes, Delete' }}
              </button>
            </div>
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
  private readonly fb = inject(FormBuilder);

  readonly communityId = signal<number>(0);
  readonly community = signal<CommunityUI | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly posts = signal<PostUI[]>([]);
  readonly postsLoading = signal(true);

  readonly showEditModal = signal(false);
  readonly savingEdit = signal(false);

  readonly editForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  readonly showDeleteModal = signal(false);
  readonly deletingCommunity = signal(false);

  readonly isModerator = computed(() => {
    const user = this.userContext.user();
    const comm = this.community();
    console.log('[CommunityDetail] isModerator check - user:', user?.id, 'comm.moderatorId:', comm?.moderatorId);
    if (!user || !comm) return false;
    return user.id === comm.moderatorId;
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      const id = parseInt(idStr || '0', 10);
      if (id > 0) {
        this.communityId.set(id);
        this.loadData(id);
      } else {
        this.error.set("Invalid community ID");
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
      this.loadPosts(id);
    } catch (err: any) {
      this.error.set(err?.message || "Failed to load community");
    } finally {
      this.loading.set(false);
    }
  }

  async loadPosts(id: number) {
    this.postsLoading.set(true);
    try {
      const paged = await firstValueFrom(this.postFacade.getByCommunity(id));
      this.posts.set(paged.items);
      console.log("RAW RESPONSE:", paged);
      console.log("ITEMS:", paged.items);
      console.log("the posts:",this.posts)
    } catch (err) {
      console.error("Failed to load posts", err);
    } finally {
      this.postsLoading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard/client/communities']);
  }

  openCreatePost() {
    this.createPostModal.open();
  }

  onPostCreated() {
    this.loadPosts(this.communityId());
  }

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  getTimeAgo(date: Date | null): string {
    if (!date) return '';
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  async toggleLike(post: PostUI) {
    try {
      await firstValueFrom(this.postFacade.toggleLike(post.id));
      // Optimistic update
      post.isLiked = !post.isLiked;
      post.likeCount += post.isLiked ? 1 : -1;
      this.posts.set([...this.posts()]);
    } catch (e) {
      console.error(e);
    }
  }

  openEditModal() {
    const c = this.community();
    if (c) {
      this.editForm.patchValue({
        title: c.title,
        description: c.description
      });
      this.showEditModal.set(true);
    }
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  async saveEdit() {
    if (this.editForm.invalid) return;
    this.savingEdit.set(true);
    try {
      const vals = this.editForm.getRawValue();
      const updated = await firstValueFrom(this.communityFacade.update(this.communityId(), vals));
      this.community.set(updated);
      this.closeEditModal();
    } catch (err: any) {
      console.error(err);
      alert("Failed to update: " + (err.message || "Unknown error"));
    } finally {
      this.savingEdit.set(false);
    }
  }

  confirmDelete() {
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
  }

  async executeDelete() {
    this.deletingCommunity.set(true);
    try {
      await firstValueFrom(this.communityFacade.delete(this.communityId()));
      this.closeDeleteModal();
      this.router.navigate(['/dashboard/client/my-created']);
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete: " + (err.message || "Unknown error"));
    } finally {
      this.deletingCommunity.set(false);
    }
  }
}