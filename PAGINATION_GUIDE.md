# Pagination Component - Usage Guide

## Overview

A reusable, stateless pagination component that works with ANY paginated API endpoint in your application. It provides a complete pagination UI with page navigation, page size selection, and loading states.

## Files Created

1. **PaginationComponent**: `src/app/shared/pagination/pagination.component.ts`
   - Standalone pagination UI component
   - Reusable across all paginated lists
   - Features: first/previous/next/last buttons, page numbers, page size selector

2. **PaginationService**: `src/app/shared/pagination/pagination.service.ts`
   - Manages pagination state using Angular signals
   - Reactive state management
   - Provides computed signals for derived state

## Features

✅ Full pagination controls (First, Previous, Next, Last buttons)
✅ Smart page number display (shows surrounding pages contextually)
✅ Page size selector (5, 10, 25, 50, 100 items per page)
✅ Total pages and total elements display
✅ Loading state indicator
✅ Disabled states for navigation edge cases
✅ OnPush change detection for performance
✅ Works with any paginated API response

## API Response Requirements

The component expects API responses with this structure (standard Spring Data pagination):

```typescript
{
  content: T[],              // Array of items
  totalElements: number,     // Total count of all items
  totalPages: number,        // Total number of pages
  number: number,            // Current page (0-indexed)
  size: number,              // Items per page
  first: boolean,            // Is first page
  last: boolean,             // Is last page
  numberOfElements: number,  // Items in current page
  empty: boolean             // Is result empty
}
```

## Implementation Example

### 1. Import the component and service

```typescript
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { PaginationService } from '../../shared/pagination/pagination.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-my-list',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `...`
})
export class MyListComponent implements OnInit {
  private readonly paginationService = inject(PaginationService);
  private readonly myApi = inject(MyApiService);
  
  // ... rest of component
}
```

### 2. Create pagination config signal

```typescript
export class MyListComponent implements OnInit {
  readonly isLoading = signal(false);
  readonly paginationConfig = signal({
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
    hasNext: false,
    hasPrevious: false,
  });
  
  readonly items: SessionHistoryItem[] = [];
}
```

### 3. Load data with pagination

```typescript
private loadData(): void {
  this.isLoading.set(true);
  
  // Get pagination params from service
  const { page, size } = this.paginationService.getParams();
  
  this.myApi.getItems(page, size).subscribe({
    next: (response: any) => {
      // Extract items from response
      this.items = response.content || [];
      
      // Update pagination config
      this.paginationConfig.set({
        currentPage: response.number ?? 0,
        pageSize: response.size ?? 10,
        totalPages: response.totalPages ?? 0,
        totalElements: response.totalElements ?? 0,
        hasNext: !response.last ?? false,
        hasPrevious: !response.first ?? false,
      });
      
      this.isLoading.set(false);
    },
    error: (err) => {
      console.error('Failed to load data:', err);
      this.isLoading.set(false);
    }
  });
}
```

### 4. Handle page changes

```typescript
onPageChange(page: number): void {
  this.paginationService.setCurrentPage(page);
  this.loadData();
}

onPageSizeChange(size: number): void {
  this.paginationService.setPageSize(size);
  this.loadData();
}
```

### 5. Add to template

```html
<div class="flex flex-col gap-6">
  <!-- Your list content -->
  <div class="flex flex-col gap-3">
    @for (item of items; track item.id) {
      <div class="item-card">
        {{ item.name }}
      </div>
    }
  </div>

  <!-- Pagination Component -->
  @if (paginationConfig().totalElements > 0) {
    <div class="mt-6 pt-6 border-t">
      <app-pagination 
        [config]="paginationConfig()"
        [isLoading]="isLoading()"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)">
      </app-pagination>
    </div>
  }
</div>
```

## Paginated APIs in Your Codebase

These endpoints can use the pagination component:

### Post Controller
- `getMyPosts(pageable)`
- `getAllPosts(pageable, title?)`
- `getPostsByCommunity(communityId, pageable)`
- `getPostsByUser(userId, pageable)`

### Community Controller
- `getAllCommunities(title?, description?, minMembers?, page?, size?, sortBy?, sortDir?)`
- `getMyCommunities(page?, size?, sortBy?, sortDir?)`
- `getMyCreatedCommunities(page?, size?, sortBy?, sortDir?)`

### Comment Controller
- `getCommentsByPost(postId, page?, size?)`
- `getMyComments(page?, size?, sortBy?, sortDir?)`

### Focus Session Controller
- `getMySessions(page?, size?, sortBy?, sortDir?)`
- `getUserSessions(userId, page?, size?, sortBy?, sortDir?)`

### User Controller
- `getAllClients(firstName?, lastName?, email?, banned?, page?, size?)`

## Focus Timer Component Implementation

The Focus Timer component has been updated to use the pagination system:

**Location**: `src/app/dashboard/components/focus-timer.component.ts`

**Changes Made**:
1. Added PaginationComponent to imports
2. Created `paginationConfig` signal to track pagination state
3. Created `isLoadingHistory` signal for loading state
4. Updated `loadSessionHistory()` to pass page/size parameters to API
5. Updated template to show pagination controls below history list
6. Added `onPageChange()` and `onPageSizeChange()` methods

**Usage in Template**:
```html
<app-pagination 
  [config]="paginationConfig()"
  [isLoading]="isLoadingHistory()"
  (pageChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)">
</app-pagination>
```

## Customization

### Change visible page count
```html
<app-pagination 
  [config]="paginationConfig()"
  [isLoading]="isLoading()"
  [visiblePagesCount]="7"
  (pageChange)="onPageChange($event)">
</app-pagination>
```

### Styling
The component uses Tailwind CSS classes. Modify the component's template to change colors, sizes, etc.

Example: Change button colors from purple to blue:
```
- border-purple-300 → border-blue-300
- hover:text-purple-600 → hover:text-blue-600
```

## Performance Considerations

- Uses OnPush change detection strategy for optimal performance
- Uses signals for reactive state management
- Only re-renders when pagination config changes
- Minimal re-renders on page navigation

## Testing

To test the pagination component:

```typescript
it('should emit pageChange event when page button clicked', () => {
  const component = new PaginationComponent();
  component.config = {
    currentPage: 0,
    pageSize: 10,
    totalPages: 5,
    totalElements: 50,
    hasNext: true,
    hasPrevious: false
  };
  
  spyOn(component.pageChange, 'emit');
  component.goToPage(1);
  
  expect(component.pageChange.emit).toHaveBeenCalledWith(1);
});
```

## Migration Checklist

To add pagination to an existing paginated list:

- [ ] Import `PaginationComponent` and `PaginationService`
- [ ] Create `paginationConfig` signal
- [ ] Create `isLoading` signal
- [ ] Update API call to pass `page` and `size` parameters
- [ ] Update API response handling to extract `content` property
- [ ] Update pagination config with response data
- [ ] Add pagination event handlers (`onPageChange`, `onPageSizeChange`)
- [ ] Add `<app-pagination>` component to template
- [ ] Test navigation and page size changes

## Common Issues

**Issue**: Pagination doesn't show
**Solution**: Ensure `paginationConfig().totalElements > 0` in template condition

**Issue**: Page doesn't change when clicking
**Solution**: Make sure `onPageChange()` method calls `this.loadData()` after setting page

**Issue**: Items don't update
**Solution**: Verify response structure has `content` property and extract it: `response.content || []`

## Future Enhancements

Potential features to add:
- [ ] Jump to specific page input
- [ ] Sort direction indicators
- [ ] Custom page size options
- [ ] Keyboard navigation
- [ ] Accessibility improvements
- [ ] Animations on page change
