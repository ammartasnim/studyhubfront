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
              placeholder="Search posts, resources, or people..."
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

      <!-- Feed Section -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <!-- Header -->
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

        <!-- Posts -->
        <div class="divide-y divide-slate-200">
          <!-- Post Item 1 -->
          <div class="px-6 py-5 hover:bg-slate-50 transition-colors">
            <div class="flex gap-4">
              <!-- Avatar -->
              <div class="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400 flex items-center justify-center flex-shrink-0">
                <span class="text-sm font-bold text-white">SC</span>
              </div>

              <!-- Post Content -->
              <div class="flex-1 min-w-0">
                <!-- Header -->
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <h3 class="font-semibold text-slate-900">Sarah Chen</h3>
                    <p class="text-xs text-slate-500 mt-1">
                      <span class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 mr-2">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        Top Contributor
                      </span>
                      <span class="text-slate-500">• 2 hours ago</span>
                    </p>
                    <p class="text-sm text-indigo-600 mt-1">in Computer Science</p>
                  </div>
                  <button class="text-slate-300 hover:text-slate-600">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>
                </div>

                <!-- Title and Description -->
                <h4 class="mt-3 font-bold text-lg text-slate-900">Understanding Binary Search Trees: A Complete Guide</h4>
                <p class="mt-2 text-slate-600 leading-relaxed">Binary Search Trees are fundamental data structures in computer science. In this post, I'll walk through insertion, deletion, and traversal operations with real-world examples and complexity analysis.</p>

                <!-- Attached Resource -->
                <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
                  <svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  </svg>
                  <div class="flex-1">
                    <p class="font-medium text-slate-900">Attached Resource</p>
                    <p class="text-sm text-slate-600">PDF Guide</p>
                  </div>
                  <button class="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex-shrink-0">
                    Download
                  </button>
                </div>

                <!-- Tags -->
                <div class="mt-4 flex flex-wrap gap-2">
                  <span class="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Data Structures
                  </span>
                  <span class="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                    Algorithms
                  </span>
                  <span class="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Tutorial
                  </span>
                </div>

                <!-- Engagement -->
                <div class="mt-4 flex items-center justify-between pt-4 border-t border-slate-200">
                  <div class="flex gap-6">
                    <button class="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h-2m0 0H8m4 0v-2m0 2v2m0 0h2m-2 0H8m12-2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h12a2 2 0 012 2z" />
                      </svg>
                      <span>247</span>
                    </button>
                    <button class="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span>43</span>
                    </button>
                  </div>
                  <div class="flex gap-3">
                    <button class="text-slate-300 hover:text-slate-600">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                    <button class="text-slate-300 hover:text-slate-600">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C9.589 12.438 10 11.211 10 9.824c0-1.663-.597-3.223-1.843-4.401-.97-.932-2.31-1.429-3.816-1.429-2.876 0-5.217 2.215-5.217 5.247 0 1.82.67 3.485 1.874 4.704M16 12a4 4 0 01-8 0m0-7h.01M12 20h.01" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Post Item 2 -->
          <div class="px-6 py-5 hover:bg-slate-50 transition-colors">
            <div class="flex gap-4">
              <!-- Avatar -->
              <div class="h-12 w-12 rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                <span class="text-sm font-bold text-white">MJ</span>
              </div>

              <!-- Post Content -->
              <div class="flex-1 min-w-0">
                <!-- Header -->
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <h3 class="font-semibold text-slate-900">Marcus Johnson</h3>
                    <p class="text-xs text-slate-500 mt-1">
                      <span class="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 mr-2">
                        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        Moderator
                      </span>
                      <span class="text-slate-500">• 5 hours ago</span>
                    </p>
                    <p class="text-sm text-indigo-600 mt-1">in Web Development</p>
                  </div>
                </div>

                <!-- Title -->
                <h4 class="mt-3 font-bold text-lg text-slate-900">React Server Components vs Client Components</h4>
                <p class="mt-2 text-slate-600 leading-relaxed">Understanding the differences and best practices for choosing between server and client components in modern React applications.</p>
              </div>
            </div>
          </div>
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
