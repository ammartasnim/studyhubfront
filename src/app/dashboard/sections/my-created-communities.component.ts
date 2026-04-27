import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunityService } from '../../services/community.service';
import { CommunityResDto } from '../../api-generated/model/communityResDto';

@Component({
  selector: 'app-my-created-communities',
  standalone: true,
  imports: [CommonModule],
  template: `
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
              aria-label="Search communities"
              class="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Search your created communities..."
            />
          </div>
        </div>

        <!-- Create New Community Button -->
        <button
          class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Community
        </button>
      </div>

      <!-- Communities Grid -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="border-b border-slate-200 px-6 py-4 bg-slate-50">
          <h2 class="text-xl font-bold text-slate-900">My Created Communities</h2>
        </div>

        <!-- Loading State -->
        @if (communityService.myCreatedCommunitiesLoading()) {
          <div class="px-6 py-10 flex justify-center">
            <div class="flex flex-col items-center gap-4">
              <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p class="text-slate-500 font-medium">Loading communities...</p>
            </div>
          </div>
        }

        <!-- Empty State -->
        @if (!communityService.myCreatedCommunitiesLoading() && communityService.isMyCreatedCommunitiesEmpty()) {
          <div class="px-6 py-10 text-center text-slate-500">
            <svg class="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <p class="text-lg font-medium text-slate-700">No communities created yet</p>
            <p class="mt-2">Create your first community to get started</p>
          </div>
        }

        <!-- Communities List -->
        @if (!communityService.myCreatedCommunitiesLoading() && !communityService.isMyCreatedCommunitiesEmpty()) {
          <div class="divide-y divide-slate-200">
            @for (community of communityService.myCreatedCommunities(); track community.id) {
              <div class="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                <div class="flex items-start gap-4">
                  <!-- Community Avatar -->
                  <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                    <span class="text-white font-bold text-lg">{{ getInitials(community.title || '') }}</span>
                  </div>

                  <!-- Community Info -->
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-slate-900">{{ community.title }}</h3>
                    <p class="text-sm text-slate-500 mt-1 line-clamp-2">{{ community.description || 'No description' }}</p>
                    
                    <!-- Meta Info -->
                    <div class="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span>👥 {{ community.nbrMembers || 0 }} members</span>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-2 flex-shrink-0">
                    <button class="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium transition-colors whitespace-nowrap">
                      Manage
                    </button>
                    <button class="px-4 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium transition-colors whitespace-nowrap">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Error State -->
        @if (communityService.myCreatedCommunitiesError()) {
          <div class="px-6 py-10 text-center text-red-600">
            <p class="text-lg font-medium">Failed to load communities</p>
            <p class="mt-2 text-sm">{{ communityService.myCreatedCommunitiesError() }}</p>
            <button 
              (click)="retryLoad()"
              class="mt-4 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        }
      </section>
    </div>
  `
})
export class MyCreatedCommunitiesComponent {
  readonly communityService = inject(CommunityService);

  constructor() {
    console.log('[MyCreatedCommunitiesComponent] Section component initialized');
    effect(() => {
      console.log('[MyCreatedCommunitiesComponent] Created communities loaded:', this.communityService.myCreatedCommunities().length);
    });
  }

  ngOnInit() {
    console.log('[MyCreatedCommunitiesComponent] Loading created communities...');
    this.communityService.loadMyCreatedCommunities();
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  retryLoad(): void {
    console.log('[MyCreatedCommunitiesComponent] Retrying load...');
    this.communityService.loadMyCreatedCommunities();
  }
}

