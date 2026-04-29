# JSON Response Handling - Quick Reference

## Common Issues & Solutions

### Issue: Backend returns HTML instead of JSON
**Root Cause**: Server error page returned instead of JSON  
**Solution**: 
- Interceptor will log: `Non-JSON response from {url}`
- Check browser console for content-type
- Verify API endpoint exists and has correct authorization
- Check ResponseHandler logs

### Issue: Response parsing fails in facade
**Root Cause**: Response structure doesn't match expected DTO  
**Solution**:
```typescript
// Use ResponseHandlerService to debug
this.responseHandler.logResponse('method', 'GET', response);

// Check response structure
console.log('Response type:', typeof response);
console.log('Is array:', Array.isArray(response));
console.log('Has content:', response?.content);
console.log('Has items:', response?.items);
```

### Issue: Paginated response not mapping correctly
**Root Cause**: Different pagination format than expected  
**Solution**: Use ResponseHandlerService.handlePagedResponse()
```typescript
// Handles both formats automatically
const items = this.responseHandler.handlePagedResponse(response);
// Returns array whether response.content or response.items
```

### Issue: Type mismatch between DTO and UI Model
**Root Cause**: UI Model has fields that don't exist in DTO  
**Solution**:
1. Check actual DTO fields from generated models
2. Update UI Model to match
3. Add null coalescing in facade: `dto.field ?? defaultValue`

## Testing Response Handling

### Manual Testing
```typescript
// In browser console
// Check interceptor logs
console.log('[ResponseHandler]')

// Test facade directly
this.communityService.getAll().subscribe(
  data => console.log('Success:', data),
  error => console.error('Error:', error)
);
```

### Unit Test Example
```typescript
it('should handle JSON response', (done) => {
  const mockResponse = { id: 1, title: 'Test' };
  
  communityFacade.getById(1).subscribe(
    result => {
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test');
      done();
    },
    error => fail(error)
  );
});
```

## Response Handler Methods

### validateJsonResponse
```typescript
// Returns true if response is valid JSON-like object/array
if (this.responseHandler.validateJsonResponse(response)) {
  // Safe to process
}
```

### handlePagedResponse
```typescript
// Handles multiple formats:
// - {content: [...]} (Spring Data)
// - {items: [...]} (Custom)
// - [...] (Direct array)
// - {object} (Single item)
const items = this.responseHandler.handlePagedResponse(response);
// Always returns array
```

### handleError
```typescript
// Centralized error handling with logging
catchError(err => 
  this.responseHandler.handleError(err, 'Context message')
)
// Returns Observable<never> - stops chain
```

### logResponse
```typescript
// Log any response for debugging
this.responseHandler.logResponse('endpoint', 'GET', response);
// Logs type, structure, timestamp
```

## Interceptor Order
```
1. responseHandlerInterceptor (validates JSON, catches errors)
2. authTokenInterceptor (adds auth token)
↓
Your Generated Service
↓
Facade (validates & maps)
↓
Component
```

**Important**: Response validation happens BEFORE auth token handling

## Standardized Error Format

All errors are caught and standardized:
```typescript
{
  success: false,
  message: "User-friendly error message",
  status: 400,
  error: {...},
  timestamp: "ISO-8601 timestamp"
}
```

## Console Logs

All response handlers log with `[ResponseHandler]` prefix:

```
[ResponseHandler] GET /api/communities
[ResponseHandler] Error from PUT /api/communities/1: Invalid JSON response
[ResponseHandler] [INFO] POST /api/communities
[ResponseHandler] [ERROR] GET /api/users/999
```

Filter console to see all response logs:
```javascript
// In browser console
console.log(document.querySelectorAll('[ResponseHandler]'))
```

## Quick Checklist for Facade Integration

- [ ] Inject `ResponseHandlerService`
- [ ] Call `validateJsonResponse()` before mapping
- [ ] Use `handlePagedResponse()` for paginated responses
- [ ] Use `handleError()` in catchError operator
- [ ] Call `logResponse()` after receiving data
- [ ] Add try-catch around DTO field access
- [ ] Test with mock non-JSON responses

## Backend Integration

When backend adds response standardization:

```java
// Spring controller should return
ResponseEntity.ok(new ApiResponse<>(true, data, "Success"));

// Or at minimum
ResponseEntity.ok(data);  // Must be JSON
```

Our system handles both automatically.
