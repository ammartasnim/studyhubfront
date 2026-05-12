import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// export const responseHandlerInterceptor: HttpInterceptorFn = (req, next) => {
//   return next(req).pipe(
//     tap({
//       next: (event) => {
//         if (event instanceof HttpResponse) {
//           const contentType = event.headers.get('content-type') || '';
//           if (event.body && !contentType.includes('application/json')) {
//             console.warn(`[ResponseHandler] Non-JSON response from ${req.url}`);
//           }
//         }
//       },
//       // USE TAP ERROR INSTEAD OF CATCHERROR
//       error: (error) => {
//         // This only LOGS. It does NOT intercept or stop the error.
//         console.error(`[ResponseHandler] Logged Error for ${req.url}:`, error.error);
//       }
//     })
//     // DO NOT put catchError here if you want it to be 100% transparent
//   );
// };
 
  //     // HANDLE JSON PARSE ERROR ON SUCCESSFUL RESPONSE
  //     // Sometimes Spring Boot returns a plain string (e.g. "User banned") 
  //     // but sets Content-Type to application/json, causing Angular to fail parsing.
  //     if (error.status === 200 && error.message?.includes('Http failure during parsing')) {
  //        const rawText = error.error?.text || 'Success';
  //        console.log(`[ResponseHandler] Intercepted text response that failed JSON parse (Status 200). Treating as success: ${rawText}`);
  //        // Return a mock HttpResponse to simulate success (using `as any` because TS might complain about the type constraint)
  //        return of(new HttpResponse({ body: rawText, status: 200, statusText: 'OK' }) as any);
  //     }

  //     console.group(`[ResponseHandler] ${req.method} ${req.url} FAILED`);
  //     console.error(`Status: ${error.status} ${error.statusText}`);

  //     const body = error.error;
  //     if (body && typeof body === 'object') {
  //       if (body.message) console.error(`Message: ${body.message}`);
  //       if (body.path) console.error(`Path: ${body.path}`);
  //       if (body.details && Array.isArray(body.details) && body.details.length > 0) {
  //         console.error(`Root Cause: ${body.details[0]}`);
  //         if (body.details.length > 1) {
  //           console.groupCollapsed('Full Stack Trace');
  //           console.error(body.details.slice(1).join('\n'));
  //           console.groupEnd();
  //         }
  //       }
  //       console.error('Full Response Body:', body);
  //     } else {
  //       console.error('Error Body:', body);
  //     }

  //     console.groupEnd();
  //     return throwError(() => error); 
  //   })
  // );


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
