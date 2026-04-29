import { Injectable, signal, computed } from '@angular/core';

/**
 * Service to manage pagination state for API calls
 * 
 * Usage:
 * constructor(private paginationService: PaginationService) {}
 * 
 * ngOnInit() {
 *   this.loadData();
 * }
 * 
 * loadData() {
 *   const page = this.paginationService.currentPage();
 *   const size = this.paginationService.pageSize();
 *   this.api.getData(page, size).subscribe(response => {
 *     this.paginationService.updateFromResponse(response);
 *   });
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  private readonly _currentPage = signal(0);
  private readonly _pageSize = signal(10);
  private readonly _totalPages = signal(0);
  private readonly _totalElements = signal(0);
  private readonly _hasNext = signal(false);
  private readonly _hasPrevious = signal(false);

  // Computed signals for derived state
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly totalElements = this._totalElements.asReadonly();
  readonly hasNext = this._hasNext.asReadonly();
  readonly hasPrevious = this._hasPrevious.asReadonly();

  readonly paginationConfig = computed(() => ({
    currentPage: this.currentPage(),
    pageSize: this.pageSize(),
    totalPages: this.totalPages(),
    totalElements: this.totalElements(),
    hasNext: this.hasNext(),
    hasPrevious: this.hasPrevious(),
  }));

  /**
   * Update pagination state from API response
   * Works with any Page*ResDto response structure
   */
  updateFromResponse(response: any): void {
    this._totalPages.set(response.totalPages ?? 0);
    this._totalElements.set(response.totalElements ?? 0);
    this._hasNext.set(response.last === false);
    this._hasPrevious.set(response.first === false);
  }

  /**
   * Set the current page
   */
  setCurrentPage(page: number): void {
    this._currentPage.set(Math.max(0, page));
  }

  /**
   * Set the page size
   */
  setPageSize(size: number): void {
    this._pageSize.set(Math.max(1, size));
    this._currentPage.set(0); // Reset to first page on size change
  }

  /**
   * Reset pagination to initial state
   */
  reset(): void {
    this._currentPage.set(0);
    this._pageSize.set(10);
    this._totalPages.set(0);
    this._totalElements.set(0);
    this._hasNext.set(false);
    this._hasPrevious.set(false);
  }

  /**
   * Get parameters for API call
   */
  getParams(): { page: number; size: number } {
    return {
      page: this.currentPage(),
      size: this.pageSize(),
    };
  }
}
