import { Component, inject, output, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatePostModalComponent } from './create-post-modal.component';
import { CreateCommunityModalComponent } from './create-community-modal.component';

@Component({
  selector: 'app-academic-feed',
  standalone: true,
  imports: [CommonModule, CreatePostModalComponent, CreateCommunityModalComponent],
  template: `
    <!-- Create Post Modal -->
    <app-create-post-modal #createPostModal (postCreated)="onPostCreated()" />
    
    <!-- Create Community Modal -->
    <app-create-community-modal #createCommunityModal (communityCreated)="onCommunityCreated()" />

    <div class="flex flex-col gap-5">
      <!-- Header with Search -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <!-- Search Bar -->
        <div class="flex-1">
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              aria-label="Search feed"
              class="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- New Post Button -->
        <div class="flex gap-2">
          <button
            (click)="openCreatePost()"
            class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </button>

          <!-- Trending Filter -->
          <button class="hidden sm:flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7H5v12h8V7z" />
            </svg>
            <span>Trending</span>
          </button>
        </div>
      </div>

      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
          <h2 class="text-xl font-bold text-slate-900">Academic Feed</h2>
          <button
            (click)="openCreateCommunity()"
            class="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Community
          </button>
        </div>

        <div class="px-6 py-10 text-center text-slate-500">
          <p class="text-lg font-medium text-slate-700">No posts yet</p>
          <p class="mt-2">Create the first post to start the feed.</p>
        </div>
      </section>
    </div>
  `
})
export class AcademicFeedComponent {
  @ViewChild('createPostModal') createPostModal!: CreatePostModalComponent;
  @ViewChild('createCommunityModal') createCommunityModal!: CreateCommunityModalComponent;

  openCreatePost(): void {
    this.createPostModal.open();
  }

  openCreateCommunity(): void {
    this.createCommunityModal.open();
  }

  onPostCreated(): void {
    console.log('[AcademicFeed] Post created successfully');
    // Reload posts if needed
  }

  onCommunityCreated(): void {
    console.log('[AcademicFeed] Community created successfully');
    // Reload communities if needed
  }
}
