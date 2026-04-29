# Quick Integration Guide

## Copy-Paste Ready Examples for Your Paginated APIs

Use these templates to quickly add pagination to your other components.

---

## Template 1: Post List Component

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostControllerService } from '../../api/generated/api/postController.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { PaginationService } from '../../shared/pagination/pagination.service';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Posts List -->
      <div class="flex flex-col gap-3">
        @for (post of posts; track post.id) {
          <div class="bg-white border border-slate-200 p-4 rounded-lg">
            <h3 class="font-semibold">{{ post.title }}</h3>
            <p class="text-slate-600 text-sm mt-2">{{ post.description }}</p>
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (paginationConfig().totalElements > 0) {
        <div class="border-t pt-4">
          <app-pagination 
            [config]="paginationConfig()"
            [isLoading]="isLoading()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
          </app-pagination>
        </div>
      }
    </div>
  `
})
export class PostListComponent implements OnInit {
  posts: any[] = [];
  readonly isLoading = signal(false);
  readonly paginationConfig = signal({
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
    hasNext: false,
    hasPrevious: false,
  });

  private readonly postService = inject(PostControllerService);
  private readonly paginationService = inject(PaginationService);

  ngOnInit() {
    this.loadPosts();
  }

  private loadPosts() {
    this.isLoading.set(true);
    const page = this.paginationService.currentPage();
    const size = this.paginationService.pageSize();

    (this.postService.getAllPosts as any)(page, size).subscribe({
      next: (response: any) => {
        this.posts = response.content || [];
        this.paginationConfig.set({
          currentPage: response.number ?? 0,
          pageSize: response.size ?? 10,
          totalPages: response.totalPages ?? 0,
          totalElements: response.totalElements ?? 0,
          hasNext: response.last === false,
          hasPrevious: response.first === false,
        });
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load posts:', err);
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.paginationService.setCurrentPage(page);
    this.loadPosts();
  }

  onPageSizeChange(size: number) {
    this.paginationService.setPageSize(size);
    this.loadPosts();
  }
}
```

---

## Template 2: Community List Component

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunityControllerService } from '../../api/generated/api/communityController.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { PaginationService } from '../../shared/pagination/pagination.service';

@Component({
  selector: 'app-community-list',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Communities -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (community of communities; track community.id) {
          <div class="bg-white border border-slate-200 p-6 rounded-lg">
            <h3 class="font-bold text-lg">{{ community.title }}</h3>
            <p class="text-slate-600 text-sm mt-2">{{ community.description }}</p>
            <p class="text-xs text-slate-400 mt-4">👥 {{ community.memberCount }} members</p>
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (paginationConfig().totalElements > 0) {
        <app-pagination 
          [config]="paginationConfig()"
          [isLoading]="isLoading()"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)">
        </app-pagination>
      }
    </div>
  `
})
export class CommunityListComponent implements OnInit {
  communities: any[] = [];
  readonly isLoading = signal(false);
  readonly paginationConfig = signal({
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
    hasNext: false,
    hasPrevious: false,
  });

  private readonly communityService = inject(CommunityControllerService);
  private readonly paginationService = inject(PaginationService);

  ngOnInit() {
    this.loadCommunities();
  }

  private loadCommunities() {
    this.isLoading.set(true);
    const page = this.paginationService.currentPage();
    const size = this.paginationService.pageSize();

    (this.communityService.getAllCommunities as any)(undefined, undefined, undefined, page, size).subscribe({
      next: (response: any) => {
        this.communities = response.content || [];
        this.paginationConfig.set({
          currentPage: response.number ?? 0,
          pageSize: response.size ?? 10,
          totalPages: response.totalPages ?? 0,
          totalElements: response.totalElements ?? 0,
          hasNext: response.last === false,
          hasPrevious: response.first === false,
        });
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load communities:', err);
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.paginationService.setCurrentPage(page);
    this.loadCommunities();
  }

  onPageSizeChange(size: number) {
    this.paginationService.setPageSize(size);
    this.loadCommunities();
  }
}
```

---

## Template 3: Comments Section

```typescript
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentControllerService } from '../../api/generated/api/commentController.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { PaginationService } from '../../shared/pagination/pagination.service';

@Component({
  selector: 'app-comments-section',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <div class="flex flex-col gap-4">
      <h3 class="font-bold text-lg">Comments</h3>

      <!-- Comments List -->
      @if (comments.length > 0) {
        <div class="flex flex-col gap-3">
          @for (comment of comments; track comment.id) {
            <div class="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <p class="font-semibold text-sm">{{ comment.authorName }}</p>
              <p class="text-slate-700 mt-2">{{ comment.content }}</p>
              <p class="text-xs text-slate-400 mt-2">{{ comment.createdAt | date }}</p>
            </div>
          }
        </div>
      } @else {
        <p class="text-slate-400 text-sm">No comments yet</p>
      }

      <!-- Pagination -->
      @if (paginationConfig().totalElements > 0) {
        <div class="border-t pt-4">
          <app-pagination 
            [config]="paginationConfig()"
            [isLoading]="isLoading()"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
          </app-pagination>
        </div>
      }
    </div>
  `
})
export class CommentsSectionComponent implements OnInit {
  @Input() postId!: number;

  comments: any[] = [];
  readonly isLoading = signal(false);
  readonly paginationConfig = signal({
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
    hasNext: false,
    hasPrevious: false,
  });

  private readonly commentService = inject(CommentControllerService);
  private readonly paginationService = inject(PaginationService);

  ngOnInit() {
    this.loadComments();
  }

  private loadComments() {
    this.isLoading.set(true);
    const page = this.paginationService.currentPage();
    const size = this.paginationService.pageSize();

    (this.commentService.getCommentsByPost as any)(this.postId, page, size).subscribe({
      next: (response: any) => {
        this.comments = response.content || [];
        this.paginationConfig.set({
          currentPage: response.number ?? 0,
          pageSize: response.size ?? 10,
          totalPages: response.totalPages ?? 0,
          totalElements: response.totalElements ?? 0,
          hasNext: response.last === false,
          hasPrevious: response.first === false,
        });
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load comments:', err);
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.paginationService.setCurrentPage(page);
    this.loadComments();
  }

  onPageSizeChange(size: number) {
    this.paginationService.setPageSize(size);
    this.loadComments();
  }
}
```

---

## Integration Steps (Same for All)

### Step 1: Copy Template
Choose one of the templates above that matches your use case.

### Step 2: Update These Parts
- Replace `PostListComponent` with your component name
- Replace `this.postService` with your service
- Replace `this.posts` with your array name
- Replace the template HTML with your item display logic
- Replace `getAllPosts` with your API method name

### Step 3: Add Imports
Make sure these are imported:
```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YourService } from '...';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { PaginationService } from '../../shared/pagination/pagination.service';
```

### Step 4: Update Component Imports
```typescript
@Component({
  // ...
  imports: [CommonModule, PaginationComponent],
})
```

### Step 5: Add Pagination to Parent
In your parent component/module, use the new component:
```html
<app-post-list></app-post-list>
```

---

## API-Specific Notes

### Post Controller
```typescript
// Use one of these methods:
this.postService.getAllPosts(page, size);
this.postService.getMyPosts(page, size);
this.postService.getPostsByCommunity(communityId, page, size);
this.postService.getPostsByUser(userId, page, size);
```

### Community Controller
```typescript
// Use one of these methods:
this.communityService.getAllCommunities(undefined, undefined, undefined, page, size);
this.communityService.getMyCommunities(page, size);
this.communityService.getMyCreatedCommunities(page, size);
```

### Comment Controller
```typescript
// Use one of these methods:
this.commentService.getCommentsByPost(postId, page, size);
this.commentService.getMyComments(page, size);
```

### Focus Session Controller
```typescript
// Use one of these methods:
(this.focusSessionService.getMySessions as any)(page, size);
(this.focusSessionService.getUserSessions as any)(userId, page, size);
```

### User Controller
```typescript
// Use this method:
this.userService.getAllClients(undefined, undefined, undefined, undefined, page, size);
```

---

## Common Patterns

### Filter + Pagination
```typescript
// Add filter inputs
@Input() filterTitle = '';

// Pass to API
(this.postService.getAllPosts as any)(page, size, this.filterTitle).subscribe({
  // ...
});

// Reset to page 0 when filter changes
@Input() set filter(value: string) {
  this.filterTitle = value;
  this.paginationService.reset();
  this.loadData();
}
```

### Sort + Pagination
```typescript
// Add sort property
readonly sortBy = signal('createdAt');
readonly sortDir = signal('DESC');

// Pass to API if supported
(this.communityService.getAllCommunities as any)(
  undefined, 
  undefined, 
  undefined, 
  page, 
  size, 
  this.sortBy(),
  this.sortDir()
).subscribe({
  // ...
});
```

### Auto-Refresh
```typescript
// Reload on interval
ngOnInit() {
  this.loadData();
  
  // Refresh every 30 seconds
  setInterval(() => this.loadData(), 30000);
}
```

---

## Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('PostListComponent', () => {
  let component: PostListComponent;
  let fixture: ComponentFixture<PostListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PostListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load posts on init', () => {
    expect(component.posts.length).toBeGreaterThan(0);
  });

  it('should change page when pagination event fired', () => {
    component.onPageChange(2);
    expect(component.paginationConfig().currentPage).toBe(2);
  });

  it('should change page size', () => {
    component.onPageSizeChange(25);
    expect(component.paginationConfig().pageSize).toBe(25);
  });
});
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Data not showing | Check `response.content` is being extracted correctly |
| Pagination not showing | Ensure `totalElements > 0` in template condition |
| Pages not changing | Verify `onPageChange()` calls `loadData()` |
| Wrong data on page 2 | Check API is receiving correct page parameter |
| Loading state stuck | Ensure `isLoading.set(false)` in success AND error handlers |

---

## Performance Tips

1. **Use track in @for**: `@for (...; track item.id)` instead of `$index`
2. **Set page size wisely**: Balance between network requests and page load time
3. **Debounce filter changes**: Avoid too many API requests
4. **Cache data**: Consider storing responses temporarily
5. **Virtual scrolling**: For very large lists, use CDK virtual scroll

---

## Next Steps

1. Choose a component to enhance
2. Copy the appropriate template
3. Customize for your needs
4. Test pagination works
5. Deploy to production

For detailed documentation, see **PAGINATION_GUIDE.md**
