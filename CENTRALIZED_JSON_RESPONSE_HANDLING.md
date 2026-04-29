# Centralized JSON Response Handling

## Overview
A complete centralized system has been implemented to ensure all API responses are JSON and properly handled across the application.

## Architecture

### 1. HTTP Interceptor (Response Validation)
**File**: `src/app/response-handler.interceptor.ts`

Runs **first** in the HTTP request chain:
- ✅ Validates response content-type
- ✅ Logs all requests/responses for debugging
- ✅ Catches non-JSON responses and logs warnings
- ✅ Standardizes error responses
- ✅ Added to app.config.ts with highest priority

**Usage**: Automatically applies to all HTTP requests

```typescript
// In app.config.ts
provideHttpClient(
  withInterceptors([
    responseHandlerInterceptor,  // Response validation (first)
    authTokenInterceptor         // Token handling (second)
  ])
)
```

### 2. Response Handler Service (JSON Processing)
**File**: `src/app/api/facades/response-handler.service.ts`

Provides methods for facades to safely handle responses:

```typescript
// Handle paginated responses (both content and items formats)
handlePagedResponse<T>(response: any): T[]

// Handle single entity responses
handleEntityResponse<T>(response: T | null | undefined): T

// Validate JSON response
validateJsonResponse(response: any): boolean

// Create standardized error responses
createErrorResponse(error: any, message?: string)

// Centralized error handler for observables
handleError(error: any, context?: string): Observable<never>

// Log response for debugging
logResponse(url: string, method: string, response: any, isError?: boolean): void
```

**Export**: Available from `src/app/api/facades/index.ts`

### 3. Integration in Facades
**Example**: `community.facade.ts`

Each facade now:
1. Injects `ResponseHandlerService`
2. Validates responses before mapping
3. Uses centralized error handling
4. Logs requests/responses for debugging

```typescript
export class CommunityFacadeService {
  private readonly communityController = inject(CommunityControllerService);
  private readonly responseHandler = inject(ResponseHandlerService);

  getAll(): Observable<PaginatedCommunities> {
    return this.communityController.getAllCommunities(...).pipe(
      map(response => {
        // Log response
        this.responseHandler.logResponse('getAllCommunities', 'GET', response);
        
        // Validate JSON
        if (!this.responseHandler.validateJsonResponse(response)) {
          throw new Error('Invalid JSON response from server');
        }
        
        // Map to UI model
        return this.mapPagedResponse(response);
      }),
      // Use centralized error handler
      catchError(err => this.responseHandler.handleError(err, 'Failed to fetch communities'))
    );
  }
}
```

## Response Flow

```
HTTP Request
    ↓
Response Validation Interceptor
├─ Check content-type
├─ Log response details
└─ Standardize errors
    ↓
ResponseHandlerService (in Facade)
├─ validateJsonResponse()
├─ handlePagedResponse() OR handleEntityResponse()
├─ logResponse()
└─ handleError() on failure
    ↓
DTO → UI Model Mapping
    ↓
Component receives clean, validated data
```

## Error Handling

All errors are standardized:

```typescript
{
  success: false,
  message: "Error description",
  status: 400,
  error: {...},
  timestamp: "2026-04-28T10:30:00.000Z"
}
```

## Non-JSON Response Handling

When the backend returns non-JSON responses:

1. **Interceptor** catches it and logs a warning
2. **ResponseHandlerService.validateJsonResponse()** detects it
3. **Facade** throws an error or returns default empty data
4. **Component** receives error notification

## Key Features

✅ **Centralized**: Single point of control for all response handling  
✅ **Validated**: All responses checked for JSON validity  
✅ **Logged**: Complete request/response logging for debugging  
✅ **Error Handling**: Standardized error responses across all facades  
✅ **Type Safe**: TypeScript validation for all responses  
✅ **Extensible**: Easy to add new response transformations  

## Adding Response Handling to Other Facades

To add JSON validation to other facades:

```typescript
// 1. Inject the service
private readonly responseHandler = inject(ResponseHandlerService);

// 2. Validate responses
map(response => {
  this.responseHandler.logResponse('method', 'GET', response);
  if (!this.responseHandler.validateJsonResponse(response)) {
    throw new Error('Invalid JSON response');
  }
  return this.mapToUI(response);
}),

// 3. Use centralized error handling
catchError(err => this.responseHandler.handleError(err, 'Context message'))
```

## Debugging

Enable debug logs by checking browser console:

```
[ResponseHandler] GET /api/communities/1
[ResponseHandler] Error from PUT /api/communities/1: ...
```

All logs include:
- HTTP method
- Endpoint URL
- Response status
- Content-type
- Response body type
- Timestamp

## Files Modified

- `src/app/response-handler.interceptor.ts` - HTTP validation layer
- `src/app/app.config.ts` - Added interceptor to app config
- `src/app/api/facades/response-handler.service.ts` - Response processing service
- `src/app/api/facades/community.facade.ts` - Example integration
- `src/app/api/facades/index.ts` - Export response handler service
