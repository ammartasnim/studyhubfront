# Facade Services Documentation

## Overview

Facade Services are a design pattern that wraps auto-generated OpenAPI services to provide:

✅ **Clean, Stable API** - Simple method names that don't change with API generation  
✅ **Type-Safe UI Models** - Strongly typed interfaces optimized for component usage  
✅ **Data Mapping** - Automatic DTO → UI Model conversion with null safety  
✅ **Error Handling** - Consistent error handling and logging  
✅ **Date/Time Conversion** - Automatic string → Date object conversion  
✅ **Pagination Support** - Unified pagination response format  

---

## Facade Services Available

### 1. CommunityFacadeService
**Location:** `src/app/api/facades/community.facade.ts`

**UI Model:** `CommunityUI`
```typescript
interface CommunityUI {
  id: number;
  title: string;
  description: string;
  memberCount: number;
  moderatorId: number;
  displayName: string; // Helper field
  shortDescription: string; // Helper field
}
```

**Methods:**
- `getAll(filters?)` → `Observable<PaginatedCommunities>`
- `getById(id)` → `Observable<CommunityUI>`
- `create(data)` → `Observable<CommunityUI>`
- `update(id, data)` → `Observable<CommunityUI>`
- `delete(id)` → `Observable<void>`
- `getMyCreated(filters?)` → `Observable<PaginatedCommunities>`
- `getMy(filters?)` → `Observable<PaginatedCommunities>`

**Usage Example:**
```typescript
export class MyCommunityComponent {
  private communityFacade = inject(CommunityFacadeService);

  communities: CommunityUI[] = [];

  loadCommunities() {
    this.communityFacade.getAll({ page: 0, size: 10 }).subscribe({
      next: (response) => {
        this.communities = response.items; // Already typed as CommunityUI[]
      },
      error: (err) => console.error(err.message)
    });
  }
}
```

---

### 2. PostFacadeService
**Location:** `src/app/api/facades/post.facade.ts`

**UI Model:** `PostUI`
```typescript
interface PostUI {
  id: number;
  title: string;
  content: string;
  images: string[];
  authorUsername: string;
  authorFirstName: string;
  authorLastName: string;
  communityTitle: string;
  authorFullName: string; // Helper field
  previewText: string; // Helper field
  imageCount: number; // Helper field
}
```

**Methods:**
- `getAll(filters?)` → `Observable<PaginatedPosts>`
- `getById(id)` → `Observable<PostUI>`
- `create(data)` → `Observable<PostUI>`
- `update(id, data)` → `Observable<PostUI>`
- `delete(id)` → `Observable<void>`
- `getMy(filters?)` → `Observable<PaginatedPosts>`
- `getByCommunity(communityId, filters?)` → `Observable<PaginatedPosts>`
- `getByUser(userId, filters?)` → `Observable<PaginatedPosts>`
- `toggleLike(postId)` → `Observable<void>`

**Usage Example:**
```typescript
export class PostListComponent {
  private postFacade = inject(PostFacadeService);

  posts: PostUI[] = [];

  loadPostsByUser(userId: number) {
    this.postFacade.getByUser(userId, { page: 0, size: 20 }).subscribe({
      next: (response) => {
        // Images already filtered and validated
        this.posts = response.items;
      }
    });
  }

  createPost(title: string, content: string) {
    this.postFacade.create({ title, content }).subscribe({
      next: (newPost) => {
        this.posts.unshift(newPost);
        // Post is fully typed with all helper fields
        console.log(`Created post by ${newPost.authorFullName}`);
      }
    });
  }
}
```

---

### 3. UserFacadeService
**Location:** `src/app/api/facades/user.facade.ts`

**UI Model:** `UserUI`
```typescript
interface UserUI {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  phoneNumber: string;
  xpPoints: number;
  level: number;
  banned: boolean;
  role: 'Admin' | 'Client';
  badges: Badge[];
  fullName: string; // Helper field
  displayName: string; // Helper field
  badge: string | null; // Helper field
  isAdmin: boolean; // Helper field
}
```

**Methods:**
- `getMe()` → `Observable<UserUI>`
- `getById(id)` → `Observable<UserUI>`
- `getAll(filters?)` → `Observable<PaginatedUsers>`
- `ban(userId)` → `Observable<string>`
- `unban(userId)` → `Observable<string>`

**Usage Example:**
```typescript
export class UserProfileComponent implements OnInit {
  private userFacade = inject(UserFacadeService);

  currentUser: UserUI | null = null;

  ngOnInit() {
    this.userFacade.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        // Role is already properly typed
        if (user.isAdmin) {
          console.log('Admin access granted');
        }
      },
      error: (err) => console.error(err.message)
    });
  }
}
```

---

### 4. CommentFacadeService
**Location:** `src/app/api/facades/comment.facade.ts`

**UI Model:** `CommentUI`
```typescript
interface CommentUI {
  id: number;
  content: string;
  postId: number;
  userId: number;
  createdAt: Date; // Already converted to Date object
  updatedAt: Date | null; // Null-safe
  previewText: string; // Helper field
}
```

**Methods:**
- `create(data)` → `Observable<CommentUI>`
- `getByPost(postId)` → `Observable<CommentUI[]>`
- `update(commentId, data)` → `Observable<CommentUI>`
- `delete(commentId)` → `Observable<void>`

**Usage Example:**
```typescript
export class PostCommentsComponent {
  private commentFacade = inject(CommentFacadeService);

  comments: CommentUI[] = [];

  loadComments(postId: number) {
    this.commentFacade.getByPost(postId).subscribe({
      next: (comments) => {
        this.comments = comments;
        // Dates are already Date objects, ready for formatting
        comments.forEach(c => {
          console.log(`Posted at: ${c.createdAt.toLocaleDateString()}`);
        });
      }
    });
  }

  addComment(postId: number, content: string) {
    this.commentFacade.create({ content, postId }).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
      }
    });
  }
}
```

---

### 5. FocusSessionFacadeService
**Location:** `src/app/api/facades/focus-session.facade.ts`

**UI Model:** `FocusSessionUI`
```typescript
interface FocusSessionUI {
  id: number;
  userId: number;
  duration: number; // in minutes
  title: string;
  description: string;
  startTime: Date; // Already converted
  endTime: Date | null; // Null-safe
  completed: boolean;
  createdAt: Date; // Already converted
  updatedAt: Date | null; // Null-safe
  displayDuration: string; // "25 min" or "1h 30min"
  durationInSeconds: number; // Helper field
}
```

**Methods:**
- `create(data)` → `Observable<FocusSessionUI>`
- `getByUser(userId)` → `Observable<FocusSessionUI[]>`
- `delete(sessionId)` → `Observable<void>`

**Usage Example:**
```typescript
export class FocusSessionComponent {
  private sessionFacade = inject(FocusSessionFacadeService);

  sessions: FocusSessionUI[] = [];

  startSession(title: string, durationMinutes: number) {
    this.sessionFacade.create({ 
      duration: durationMinutes, 
      title 
    }).subscribe({
      next: (session) => {
        // Duration already formatted for display
        console.log(`Started: ${session.title} (${session.displayDuration})`);
        this.sessions.push(session);
      }
    });
  }

  loadSessions(userId: number) {
    this.sessionFacade.getByUser(userId).subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        // All dates ready for use in templates or formatting
      }
    });
  }
}
```

---

## Key Features

### 1. Safe Null Handling
All facades handle null/undefined values:
```typescript
// If API returns null, facade provides safe defaults
private mapToUI(dto: PostResDto | null | undefined): PostUI {
  if (!dto) {
    throw new Error('Post data is null or undefined');
  }
  return {
    title: dto.title ?? 'Untitled Post', // Fallback to default
    content: dto.content ?? '',
    images: Array.isArray(dto.imgs) ? dto.imgs.filter(img => !!img) : []
  };
}
```

### 2. Consistent Error Handling
```typescript
private handleError(error: any, message: string): Observable<never> {
  console.error(`[CommunityFacade] ${message}:`, error);
  const errorMsg = error?.message || error?.error?.message || message;
  return throwError(() => new Error(errorMsg));
}
```

### 3. Date Conversion
String dates are automatically converted to Date objects:
```typescript
createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : null,
```

### 4. Helper Fields
UI models include computed helper fields for common needs:
```typescript
authorFullName: `${firstName} ${lastName}`.trim() || 'Unknown',
previewText: this.truncate(content, 100),
imageCount: images.length,
displayName: `${title} (${memberCount} members)`,
```

### 5. Pagination Unified Format
All paginated responses use consistent structure:
```typescript
interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
```

---

## Best Practices

### ✅ DO: Use Facade Services
```typescript
// Good: Use facade service
this.communityFacade.getAll().subscribe(response => {
  this.communities = response.items; // Strongly typed
});
```

### ❌ DON'T: Use Generated Services Directly
```typescript
// Bad: Generated service exposes DTO complexity
this.communityController.getAllCommunities(0, 10, 'id', 'asc').subscribe(response => {
  // Complex response handling needed
});
```

### ✅ DO: Handle Errors Gracefully
```typescript
// Good: Leverage facade error handling
this.userFacade.getById(123).subscribe({
  next: (user) => { /* use user */ },
  error: (err) => this.errorMessage = err.message
});
```

### ✅ DO: Use Helper Fields in Templates
```html
<!-- Good: Use pre-computed helper fields -->
<p>Posted by {{ post.authorFullName }}</p>

<!-- Bad: Concatenate in template -->
<p>Posted by {{ post.authorFirstName }} {{ post.authorLastName }}</p>
```

---

## Example Components

See complete working examples in:
- `src/app/api/facades/examples/post-list.example.ts`
- `src/app/api/facades/examples/community-detail.example.ts`

Both examples demonstrate proper facade usage, error handling, pagination, and null safety.

---

## Migration Guide

### Step 1: Replace Import
```typescript
// Before
import { CommunityControllerService } from '../../api-generated/api/communityController.service';
import { CommunityReqDto } from '../../api-generated/model/communityReqDto';

// After
import { CommunityFacadeService, CommunityUI } from '../../api/facades';
```

### Step 2: Inject Facade Instead of Generated Service
```typescript
// Before
private communityController = inject(CommunityControllerService);

// After
private communityFacade = inject(CommunityFacadeService);
```

### Step 3: Use Cleaner API
```typescript
// Before
this.communityController.getAllCommunities(
  undefined, undefined, undefined, page, size, 'id', 'asc'
).subscribe(...);

// After
this.communityFacade.getAll({ page, size }).subscribe(...);
```

---

## Type Safety

All facades provide full TypeScript support:

```typescript
// ✅ Errors caught at compile time
this.postFacade.create({ 
  title: 'My Post',
  // ERROR: 'content' is required - caught by TypeScript!
}).subscribe(...);

// ✅ IDE autocomplete for all methods
this.userFacade.
  // Intellisense shows: getMe, getById, getAll, ban, unban

// ✅ UI Model properties are typed
const user = userUI; // UserUI type
console.log(user.isAdmin); // ✅ Property exists
console.log(user.invalidProperty); // ❌ TypeScript error
```

---

## Summary

Facade Services provide the **best of both worlds**:
- Freedom to regenerate APIs without breaking components
- Clean, semantic method names
- Automatic data mapping and transformation
- Type-safe UI models
- Consistent error handling
- Production-ready error logging

Use them throughout your application for maintainability and flexibility!
