import { Component, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CommunityService } from '../../services/community.service';
import { CommunityUI } from '../../api/facades';

@Component({
  selector: 'app-my-communities',
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
              placeholder="Search your communities..."
            />
          </div>
        </div>
      </div>

      <!-- Communities Grid -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="border-b border-slate-200 px-6 py-4 bg-slate-50">
          <h2 class="text-xl font-bold text-slate-900">My Communities</h2>
        </div>

        <!-- Loading State -->
        @if (communityService.myJoinedCommunitiesLoading()) {
          <div class="px-6 py-10 flex justify-center">
            <div class="flex flex-col items-center gap-4">
              <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p class="text-slate-500 font-medium">Loading communities...</p>
            </div>
          </div>
        }

        <!-- Empty State -->
        @if (!communityService.myJoinedCommunitiesLoading() && communityService.isMyJoinedCommunitiesEmpty()) {
          <div class="px-6 py-10 text-center text-slate-500">
            <svg class="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <p class="text-lg font-medium text-slate-700">No communities yet</p>
            <p class="mt-2">Join a community to see it here</p>
          </div>
        }

        <!-- Communities List -->
        @if (!communityService.myJoinedCommunitiesLoading() && !communityService.isMyJoinedCommunitiesEmpty()) {
          <div class="divide-y divide-slate-200">
            @for (community of communityService.myJoinedCommunities(); track community.id) {
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

                  <!-- Action Button -->
                  <button (click)="viewCommunity(community.id)" class="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium transition-colors flex-shrink-0 whitespace-nowrap">
                    View
                  </button>
                </div>
              </div>
            }
          </div>
        }

        <!-- Error State -->
        @if (communityService.myJoinedCommunitiesError()) {
          <div class="px-6 py-10 text-center text-red-600">
            <p class="text-lg font-medium">Failed to load communities</p>
            <p class="mt-2 text-sm">{{ communityService.myJoinedCommunitiesError() }}</p>
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
export class MyCommunitiesComponent {
  readonly communityService = inject(CommunityService);
  private readonly router = inject(Router);

  constructor() {
    console.log('[MyCommunitiesComponent] Section component initialized');
    effect(() => {
      console.log('[MyCommunitiesComponent] Communities loaded:', this.communityService.myJoinedCommunities().length);
    });
  }

  ngOnInit() {
    console.log('[MyCommunitiesComponent] Loading joined communities...');
    this.communityService.loadMyJoinedCommunities();
  }

  getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  viewCommunity(id: number): void {
    this.router.navigate(['/dashboard/client/community', id]);
  }

  retryLoad(): void {
    console.log('[MyCommunitiesComponent] Retrying load...');
    this.communityService.loadMyJoinedCommunities();
  }
}
