import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommunityService } from '../../services/community.service';

@Component({
  selector: 'app-my-communities',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div>
      <!-- Header with collapse toggle -->
      <div class="flex items-center justify-between px-4 mb-2">
        <p class="text-xs font-semibold uppercase text-slate-500">My Communities</p>
        <button
          (click)="toggleCollapsed()"
          class="text-slate-400 hover:text-slate-600 transition-colors"
          [attr.aria-expanded]="!isCollapsed()"
        >
          <svg 
            class="w-4 h-4 transition-transform" 
            [class.rotate-180]="!isCollapsed()"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      @if (!isCollapsed()) {
        <nav class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          @if (isLoading()) {
            <!-- Loading State -->
            <div class="px-4 py-3 text-sm text-slate-500 text-center">
              <span class="inline-block animate-spin mr-2">⟳</span>
              Loading...
            </div>
          } @else if (isEmpty()) {
            <!-- Empty State -->
            <button
              (click)="navigateToJoin()"
              class="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-indigo-50 transition-colors text-sm"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Join Communities</span>
            </button>
          } @else {
            <!-- Communities List -->
            @for (community of communities(); track community.id) {
              <a
                [routerLink]="['/dashboard/communities', community.id]"
                routerLinkActive="bg-indigo-100 text-indigo-700"
                class="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
              >
                <div class="flex-1">
                  <p class="font-medium truncate text-sm">{{ community.title }}</p>
                  <p class="text-xs text-slate-500">{{ community.nbrMembers }} members</p>
                </div>
              </a>
            }
          }
        </nav>
      }
    </div>
  `,
  styles: []
})
export class MyCommunitiesComponent {
  private readonly communityService = inject(CommunityService);

  // State signals
  readonly isCollapsed = signal(false);
  readonly communities = this.communityService.myJoinedCommunities;
  readonly isLoading = this.communityService.myJoinedCommunitiesLoading;
  readonly isEmpty = this.communityService.isMyJoinedCommunitiesEmpty;
  readonly error = this.communityService.myJoinedCommunitiesError;

  constructor() {
    console.log('[MyCommunitiesComponent] Component initialized');
    
    // Load communities on init
    effect(() => {
      console.log('[MyCommunitiesComponent] Effect triggered - loading joined communities...');
      this.communityService.loadMyJoinedCommunities();
    }, { allowSignalWrites: true });
  }

  toggleCollapsed(): void {
    const newState = !this.isCollapsed();
    console.log('[MyCommunitiesComponent] toggleCollapsed called - new state:', newState);
    this.isCollapsed.update((value: boolean) => !value);
  }

  navigateToJoin(): void {
    console.log('[MyCommunitiesComponent] navigateToJoin called');
    // Will emit event or use router
    // For now, this is a placeholder
  }
}
