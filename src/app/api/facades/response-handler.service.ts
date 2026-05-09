import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

/**
 * Centralized Response Handler Service
 * Provides methods to handle, validate, and transform API responses
 * All facades should use this service for consistent response handling
 */
@Injectable({
  providedIn: 'root'
})
export class ResponseHandlerService {
  /**
   * Handle paginated API responses
   * Converts both array and paginated object responses to consistent format
   */
  handlePagedResponse<T>(response: any): T[] | any {
    if (!response) {
      return [];
    }

    // If response has content property (Spring Data format)
    if (Array.isArray(response.content)) {
      return response.content;
    }

    // If response has items property (custom format)
    if (Array.isArray(response.items)) {
      return response.items;
    }

    // If response is already an array
    if (Array.isArray(response)) {
      return response;
    }

    // If response is a single object, wrap it in array
    return [response];
  }

  /**
   * Handle single entity responses
   * Returns the data or throws error if null/undefined
   */
  handleEntityResponse<T>(response: T | null | undefined, errorMessage?: string): T {
    if (!response) {
      throw new Error(errorMessage || 'No data returned from server');
    }
    return response;
  }

  /**
   * Validate JSON response
   * Ensures response is valid JSON
   */
  validateJsonResponse(response: any): boolean {
    if (response === null || response === undefined) {
      return false;
    }

    // Check if it's a plain object or array
    if (typeof response === 'object') {
      return true;
    }

    // Try to parse if it's a string
    if (typeof response === 'string') {
      try {
        JSON.parse(response);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(error: any, message?: string) {
    console.error('[ResponseHandler] Error:', {
      message: message || error?.message,
      status: error?.status,
      error
    });

    return {
      success: false,
      message: message || error?.message || 'An error occurred',
      status: error?.status,
      error,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Centralized error handler for observables
   * Use with catchError() in facades
   */
  handleError(error: any, context?: string): Observable<never> {
    console.error(`[ResponseHandler${context ? ` - ${context}` : ''}] Request failed:`, {
      status: error?.status,
      message: error?.message || error?.error?.message,
      fullError: error
    });

    const errorMessage = error?.error?.message || 
                        error?.message || 
                        'An error occurred while processing your request';

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Log response for debugging
   */
  logResponse(url: string, method: string, response: any, isError: boolean = false): void {
    const level = isError ? 'error' : 'info';
    console.log(`[ResponseHandler] [${level.toUpperCase()}] ${method} ${url}`, {
      responseType: typeof response,
      isArray: Array.isArray(response),
      isObject: typeof response === 'object',
      hasData: !!response,
      timestamp: new Date().toISOString()
    });
  }
}
