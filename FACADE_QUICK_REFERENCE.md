# Facade Services Quick Reference Guide

## 📁 File Structure

```
src/app/api/facades/
├── index.ts                          # Central export point
├── community.facade.ts               # Community Facade Service
├── post.facade.ts                    # Post Facade Service
├── user.facade.ts                    # User Facade Service
├── comment.facade.ts                 # Comment Facade Service
├── focus-session.facade.ts           # Focus Session Facade Service
├── models/
│   ├── community.model.ts            # CommunityUI, PaginatedCommunities
│   ├── post.model.ts                 # PostUI, PaginatedPosts
│   ├── user.model.ts                 # UserUI, PaginatedUsers, Badge
│   ├── comment.model.ts              # CommentUI
│   └── focus-session.model.ts        # FocusSessionUI
└── examples/
    ├── post-list.example.ts          # Example: Post List Component
    └── community-detail.example.ts   # Example: Community Detail Component
```

---

## 🚀 Quick Start

### Import
```typescript
import { 
  CommunityFacadeService, 
  CommunityUI,
  PaginatedCommunities 
} from '../../api/facades';
```

### Inject & Use
```typescript
export class MyComponent {
  private communityFacade = inject(CommunityFacadeService);

  loadCommunities() {
    this.communityFacade.getAll({ page: 0, size: 10 }).subscribe({
      next: (response: PaginatedCommunities) => {
        console.log(response.items); // CommunityUI[]
      },
      error: (err) => console.error(err.message)
    });
  }
}
```

---

## 📋 Facade Services Summary

| Service | Methods | Input | Output | Notes |
|---------|---------|-------|--------|-------|
| **CommunityFacadeService** | getAll, getById, create, update, delete, getMyCreated, getMy | Filters or IDs | CommunityUI or PaginatedCommunities | None required |
| **PostFacadeService** | getAll, getById, create, update, delete, getMy, getByCommunity, getByUser, toggleLike | Filters or IDs | PostUI or PaginatedPosts | Images array filtered |
| **UserFacadeService** | getMe, getById, getAll, ban, unban | Filters or IDs | UserUI or PaginatedUsers | Role typed as enum |
| **CommentFacadeService** | create, getByPost, update, delete | Content + PostId | CommentUI | Dates converted to Date |
| **FocusSessionFacadeService** | create, getByUser, delete | Duration in minutes | FocusSessionUI | Duration formatted |

---

## 🔍 UI Models Overview

### CommunityUI
```typescript
{
  id, title, description,
  memberCount, moderatorId,
  displayName,          // "Title (X members)"
  shortDescription      // Truncated description
}
```

### PostUI
```typescript
{
  id, title, content, images, 
  authorUsername, authorFirstName, authorLastName, communityTitle,
  authorFullName,       // "FirstName LastName"
  previewText,          // Truncated content
  imageCount            // images.length
}
```

### UserUI
```typescript
{
  id, username, email, firstName, lastName,
  profileImageUrl, phoneNumber, xpPoints, level,
  banned, role, badges,
  fullName,             // "FirstName LastName"
  displayName,          // Computed display name
  badge,                // First badge name
  isAdmin               // true if role === 'Admin'
}
```

### CommentUI
```typescript
{
  id, content, postId, userId,
  createdAt,            // Date object
  updatedAt,            // Date object or null
  previewText           // Truncated content
}
```

### FocusSessionUI
```typescript
{
  id, userId, duration, title, description,
  startTime,            // Date object
  endTime,              // Date object or null
  completed, createdAt, updatedAt,
  displayDuration,      // "25 min" or "1h 30min"
  durationInSeconds     // duration * 60
}
```

---

## ✨ Key Features

| Feature | Description | Example |
|---------|-------------|---------|
| **Auto Mapping** | DTO → UI Model automatic conversion | All DTO fields mapped with null safety |
| **Date Conversion** | String dates → Date objects | `createdAt: new Date(dto.createdAt)` |
| **Helper Fields** | Pre-computed UI properties | `authorFullName`, `displayDuration` |
| **Null Safety** | All fields handle null/undefined | `title ?? 'Untitled'` |
| **Error Handling** | Consistent logging & error messages | Errors logged with [ServiceName] prefix |
| **Pagination** | Unified pagination format | Same structure across all services |
| **Validation** | Input validation before API calls | IDs checked, strings trimmed |
| **Type Safety** | Full TypeScript support | IDE autocomplete, compile-time checks |

---

## 🎯 Common Patterns

### Load Paginated Data
```typescript
this.communityFacade.getAll({
  page: 0,
  size: 10,
  title: 'Angular'
}).subscribe(response => {
  this.items = response.items;
  this.totalPages = response.totalPages;
});
```

### Get Single Item
```typescript
this.postFacade.getById(123).subscribe({
  next: (post) => this.currentPost = post,
  error: (err) => this.error = err.message
});
```

### Create New Item
```typescript
this.userFacade.create?.({
  title: 'New Post',
  content: 'Hello world'
}).subscribe(newItem => {
  this.items.unshift(newItem);
});
```

### Handle Dates
```typescript
const comment = this.commentUI;
console.log(comment.createdAt.toLocaleDateString());  // Already a Date
console.log(comment.createdAt.getTime());              // Can use Date methods
```

### Check User Role
```typescript
const user = this.userUI;
if (user.isAdmin) {
  // Show admin panel
}
if (user.role === 'Admin') {
  // Alternative check
}
```

---

## 🛠️ Troubleshooting

### Error: "Cannot find module"
**Solution:** Check import path uses correct facade:
```typescript
import { CommunityFacadeService } from '../../api/facades'; // ✅
import { CommunityFacade } from '../../api/facade'; // ❌
```

### Type Error: "Property does not exist"
**Solution:** Use correct UI model type:
```typescript
const community: CommunityUI = response; // ✅
const community: CommunityResDto = response; // ❌
```

### Null Reference Error
**Solution:** Facade handles this, but check null in template:
```html
@if (post) {
  <h1>{{ post.title }}</h1>
}
```

### Date Display Issues
**Solution:** Dates are already Date objects:
```typescript
// ✅ Works in template
{{ comment.createdAt | date }}

// ❌ Don't parse again
{{ comment.createdAt | date: new Date() }}
```

---

## 📚 Learn More

- Full documentation: `FACADE_SERVICES_DOCUMENTATION.md`
- Example component: `post-list.example.ts`
- Example component: `community-detail.example.ts`

---

## 🎓 Best Practices Checklist

- [ ] Always inject Facade Service, not Controller
- [ ] Use facade's built-in error handling
- [ ] Access `.items` for paginated results
- [ ] Don't import DTO types in components
- [ ] Use helper fields (authorFullName, displayDuration, etc.)
- [ ] Handle null states in templates with `@if`
- [ ] Use `| date` pipe directly with Date fields
- [ ] Let facade handle validation

---

**Last Updated:** April 28, 2026
**Version:** 1.0
