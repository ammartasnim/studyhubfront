import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { CommunityFacadeService } from '../../api/facades/community.facade';
import { CommunityUI } from '../../api/facades/models/community.model';
import { PaginationComponent, PaginationConfig } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-explore-communities',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent],
  template: `
    <div class="flex flex-col gap-6 pb-10">
      <!-- Header & Search -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold text-slate-900">Explore Communities</h1>
        <div class="relative w-full sm:w-96">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            [formControl]="searchControl"
            placeholder="Search communities by name..."
            class="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      <!-- Main Content -->
      <section class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        
        @if (isLoading()) {
          <div class="flex-1 flex items-center justify-center p-10">
            <div class="flex flex-col items-center gap-4">
              <div class="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p class="text-slate-500 font-medium">Searching communities...</p>
            </div>
          </div>
        } @else if (error()) {
          <div class="flex-1 flex items-center justify-center p-10 text-center text-red-600">
            <div>
              <p class="text-lg font-medium">Failed to load communities</p>
              <p class="mt-2 text-sm">{{ error() }}</p>
              <button (click)="retryLoad()" class="mt-4 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors">Retry</button>
            </div>
          </div>
        } @else if (communities().length === 0) {
          <div class="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-500">
            <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p class="text-lg font-medium text-slate-700">No communities found</p>
            <p class="mt-1">Try adjusting your search criteria</p>
          </div>
        } @else {
          <div class="flex-1 divide-y divide-slate-100">
            @for (community of communities(); track community.id) {
              <div class="px-6 py-5 hover:bg-slate-50 transition-colors flex items-start sm:items-center gap-4 cursor-pointer" (click)="viewCommunity(community.id)">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span class="text-white font-bold text-lg">{{ getInitials(community.title) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-slate-900 truncate">{{ community.title }}</h3>
                  <p class="text-sm text-slate-500 mt-1 line-clamp-2">{{ community.description || 'No description available for this community.' }}</p>
                  <div class="flex items-center gap-4 mt-2.5 text-xs font-medium text-slate-500">
                    <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
                      {{ community.nbrMembers || 0 }} members
                    </span>
                  </div>
                </div>
                <div class="hidden sm:block flex-shrink-0">
                  <button class="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold shadow-sm transition-colors whitespace-nowrap">
                    View
                  </button>
                </div>
              </div>
            }
          </div>
        }
        
        <!-- Pagination controls at the bottom of the section -->
        <div class="border-t border-slate-200 bg-slate-50 p-4">
          <app-pagination 
            [config]="paginationConfig()" 
            [isLoading]="isLoading()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
          </app-pagination>
        </div>
      </section>
    </div>
  `
})
export class ExploreCommunitiesComponent implements OnInit, OnDestroy {
  private readonly communityFacade = inject(CommunityFacadeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly communities = signal<CommunityUI[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly searchControl = new FormControl('');
  private readonly destroy$ = new Subject<void>();

  readonly paginationConfig = signal<PaginationConfig>({
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  });

  ngOnInit() {
    // 1. Listen to URL changes (back button, initial load, or programmatic navigation)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const page = parseInt(params['page'] || '0', 10);
      const size = parseInt(params['size'] || '10', 10);
      const title = params['title'] || '';
      
      // Update form control without triggering valueChanges (which would cause infinite loop)
      if (this.searchControl.value !== title) {
        this.searchControl.setValue(title, { emitEvent: false });
      }
      
      this.loadData(page, size, title);
    });

    // 2. Listen to user typing in the search bar
    this.searchControl.valueChanges.pipe(
      debounceTime(500), // wait 500ms after user stops typing
      distinctUntilChanged(), // only emit if value actually changed
      takeUntil(this.destroy$)
    ).subscribe(title => {
      // Update URL query params, resetting to page 0 for new searches
      this.updateQueryParams({ title: title || null, page: 0 }); 
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(page: number, size: number, title: string) {
    const safePage = Math.max(0, page);
    this.isLoading.set(true);
    this.error.set(null);

    this.communityFacade.getAll({ page: safePage, size, title }).subscribe({
      next: (res) => {
        this.communities.set(res.items);
        this.paginationConfig.set({
          currentPage: res.currentPage,
          pageSize: res.pageSize,
          totalElements: res.totalItems,
          totalPages: res.totalPages,
          hasNext: res.currentPage < res.totalPages - 1,
          hasPrevious: res.currentPage > 0
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load communities', err);
        this.error.set(err.message || 'An error occurred while fetching communities.');
        this.isLoading.set(false);
      }
    });
  }

  retryLoad() {
    const params = this.route.snapshot.queryParams;
    this.loadData(
      parseInt(params['page'] || '0', 10),
      parseInt(params['size'] || '10', 10),
      params['title'] || ''
    );
  }

  updateQueryParams(queryParams: any) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge' // preserves other query params not specified here
    });
  }

  onPageChange(page: number) {
    this.updateQueryParams({ page });
  }

  onPageSizeChange(size: number) {
    this.updateQueryParams({ size, page: 0 });
  }

  viewCommunity(id: number) {
    this.router.navigate(['/dashboard/client/community', id]);
  }

  getInitials(name: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
}