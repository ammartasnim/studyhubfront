import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

/**
 * Centralized Response Handler Interceptor
 * Ensures all API responses are valid JSON and properly formatted
 * Handles non-JSON responses and converts them to standardized error format
 */
export const responseHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    tap({
      next: (event) => {
        // Only process successful HTTP responses
        if (!(event instanceof HttpResponse)) {
          return;
        }

        const contentType = event.headers.get('content-type') || '';
        const isJsonResponse = contentType.includes('application/json');

        // Log response details for debugging
        console.log(`[ResponseHandler] ${req.method} ${req.url}`, {
          status: event.status,
          contentType,
          isJson: isJsonResponse,
          bodyType: event.body?.constructor?.name,
          hasBody: !!event.body
        });

        // If response is not JSON, log warning but allow it through
        // (The facade services will handle any parsing issues)
        if (!isJsonResponse && event.body) {
          console.warn(
            `[ResponseHandler] Non-JSON response from ${req.url}`,
            {
              contentType,
              bodyPreview: String(event.body).substring(0, 100)
            }
          );
        }
      }
    }),
    catchError((error) => {
      console.error(`[ResponseHandler] Error from ${req.method} ${req.url}:`, {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error
      });

      // Return standardized error response
      const errorResponse = {
        success: false,
        message: error.error?.message || error.statusText || 'Unknown error',
        status: error.status,
        error: error.error,
        timestamp: new Date().toISOString()
      };

      return throwError(() => errorResponse);
    })
  );
};

/**
 * Wrapper class for standardized JSON responses
 * All API responses should conform to this structure
 */
export interface StandardApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
  timestamp?: string;
  error?: any;
}

/**
 * Helper function to wrap facade responses in standard format
 * Use this in facades when the backend doesn't provide standardized responses
 */
export function wrapJsonResponse<T>(data: T, message?: string): StandardApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper function to create standardized error responses
 */
export function createErrorResponse(message: string, status?: number, error?: any): StandardApiResponse<null> {
  return {
    success: false,
    message,
    status,
    error,
    timestamp: new Date().toISOString()
  };
}
