import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PaginationConfig {
  totalPages: number;
  totalElements: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Reusable pagination component that works with any paginated API response
 * 
 * Usage:
 * <app-pagination 
 *   [config]="paginationConfig"
 *   [isLoading]="isLoading"
 *   (pageChange)="onPageChange($event)"
 *   (pageSizeChange)="onPageSizeChange($event)">
 * </app-pagination>
 */
@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <!-- Info Section -->
      <div class="flex items-center justify-between px-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-600">
            Page <span class="font-semibold">{{ config.currentPage + 1 }}</span> of <span class="font-semibold">{{ config.totalPages }}</span>
          </span>
          <span class="text-xs text-slate-400">•</span>
          <span class="text-sm text-slate-600">
            <span class="font-semibold">{{ config.totalElements }}</span> total items
          </span>
        </div>

        <!-- Page Size Selector -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-500 uppercase">Items per page:</label>
          <select 
            [value]="config.pageSize"
            (change)="onPageSizeChange($event)"
            [disabled]="isLoading"
            class="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 cursor-pointer hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <!-- Navigation Section -->
      <div class="flex items-center justify-center gap-2">
        <!-- First Page Button -->
        <button
          (click)="goToFirstPage()"
          [disabled]="isLoading || config.currentPage === 0"
          title="First page"
          class="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-purple-300 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <span class="text-lg">⟨⟨</span>
        </button>

        <!-- Previous Page Button -->
        <button
          (click)="goToPreviousPage()"
          [disabled]="isLoading || !config.hasPrevious"
          title="Previous page"
          class="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-purple-300 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <span class="text-lg">‹</span>
        </button>

        <!-- Page Numbers -->
        <div class="flex items-center gap-1">
          @for (pageNum of visiblePages; track pageNum) {
            <button
              (click)="goToPage(pageNum)"
              [disabled]="isLoading"
              [class.bg-purple-600]="pageNum === config.currentPage"
              [class.text-white]="pageNum === config.currentPage"
              [class.border-purple-600]="pageNum === config.currentPage"
              [class.bg-white]="pageNum !== config.currentPage"
              [class.text-slate-600]="pageNum !== config.currentPage"
              [class.border-slate-200]="pageNum !== config.currentPage"
              class="w-8 h-8 border rounded-lg font-semibold text-sm transition-all hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ pageNum + 1 }}
            </button>
          }
        </div>

        <!-- Next Page Button -->
        <button
          (click)="goToNextPage()"
          [disabled]="isLoading || !config.hasNext"
          title="Next page"
          class="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-purple-300 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <span class="text-lg">›</span>
        </button>

        <!-- Last Page Button -->
        <button
          (click)="goToLastPage()"
          [disabled]="isLoading || config.currentPage === config.totalPages - 1"
          title="Last page"
          class="p-2 border border-slate-200 rounded-lg text-slate-600 hover:border-purple-300 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <span class="text-lg">⟩⟩</span>
        </button>
      </div>

      <!-- Loading Indicator -->
      @if (isLoading) {
        <div class="flex items-center justify-center py-2">
          <div class="text-xs text-slate-400">Loading...</div>
        </div>
      }
    </div>
  `
})
export class PaginationComponent {
  @Input() config!: PaginationConfig;
  @Input() isLoading = false;
  @Input() visiblePagesCount = 5; // Number of page buttons to show

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get visiblePages(): number[] {
    const { currentPage, totalPages } = this.config;
    const halfVisible = Math.floor(this.visiblePagesCount / 2);
    
    let start = Math.max(0, currentPage - halfVisible);
    let end = Math.min(totalPages, start + this.visiblePagesCount);
    
    // Adjust start if we're near the end
    if (end - start < this.visiblePagesCount) {
      start = Math.max(0, end - this.visiblePagesCount);
    }
    
    return Array.from({ length: end - start }, (_, i) => start + i);
  }

  goToPage(page: number): void {
    if (page !== this.config.currentPage && page >= 0 && page < this.config.totalPages) {
      this.pageChange.emit(page);
    }
  }

  goToFirstPage(): void {
    if (this.config.currentPage !== 0) {
      this.pageChange.emit(0);
    }
  }

  goToPreviousPage(): void {
    if (this.config.hasPrevious) {
      this.pageChange.emit(this.config.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.config.hasNext) {
      this.pageChange.emit(this.config.currentPage + 1);
    }
  }

  goToLastPage(): void {
    const lastPage = this.config.totalPages - 1;
    if (this.config.currentPage !== lastPage) {
      this.pageChange.emit(lastPage);
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    if (newSize !== this.config.pageSize) {
      this.pageSizeChange.emit(newSize);
    }
  }
}
