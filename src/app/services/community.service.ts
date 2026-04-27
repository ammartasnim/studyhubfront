import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommunityControllerService } from '../api-generated/api/communityController.service';
import { CommunityResDto } from '../api-generated/model/communityResDto';
import { PageCommunityResDto } from '../api-generated/model/pageCommunityResDto';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Service to manage community state using Angular Signals
 * Provides a clean abstraction over CommunityControllerService
 * for UI components to consume community data reactively
 *
 * Endpoints:
 * - GET /api/communities - All communities (public)
 * - GET /api/communities/my - Communities joined by current user
 * - GET /api/communities/my-created - Communities created by current user
 */
@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly communityController = inject(CommunityControllerService);

  // Signal state for "All Communities"
  readonly communities = signal<CommunityResDto[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Signals for "My Communities" (joined)
  readonly myJoinedCommunities = signal<CommunityResDto[]>([]);
  readonly myJoinedCommunitiesLoading = signal(false);
  readonly myJoinedCommunitiesError = signal<string | null>(null);

  // Signals for "My Created Communities"
  readonly myCreatedCommunities = signal<CommunityResDto[]>([]);
  readonly myCreatedCommunitiesLoading = signal(false);
  readonly myCreatedCommunitiesError = signal<string | null>(null);

  // Computed state
  readonly isEmpty = computed(() => this.communities().length === 0);
  readonly hasError = computed(() => this.error() !== null);
  readonly isMyJoinedCommunitiesEmpty = computed(() => this.myJoinedCommunities().length === 0);
  readonly hasMyJoinedCommunitiesError = computed(() => this.myJoinedCommunitiesError() !== null);
  readonly isMyCreatedCommunitiesEmpty = computed(() => this.myCreatedCommunities().length === 0);
  readonly hasMyCreatedCommunitiesError = computed(() => this.myCreatedCommunitiesError() !== null);

  /**
   * Fetch all communities with optional filters
   * Updates the communities signal with the result
   */
  async loadCommunities(params?: {
    page?: number;
    size?: number;
    title?: string;
  }): Promise<void> {
    console.log('[CommunityService] loadCommunities called with params:', params);
    this.isLoading.set(true);
    this.error.set(null);

    try {
      console.log('[CommunityService] Making API call to getAllCommunities...');
      
      const response: any = await firstValueFrom(
        this.communityController.getAllCommunities(
          params?.title,
          undefined,
          undefined,
          params?.page ?? 0,
          params?.size ?? 100 // Default to 100 communities in sidebar
        )
      );

      console.log('[CommunityService] API Response received');
      console.log('[CommunityService] Response type:', typeof response);
      console.log('[CommunityService] Response constructor:', response?.constructor?.name);
      console.log('[CommunityService] Is Blob?', response instanceof Blob);
      console.log('[CommunityService] Raw response:', response);

      // Handle Blob response (backend might return application/octet-stream)
      if (response instanceof Blob) {
        console.warn('[CommunityService] ⚠️ Response is a Blob! Converting to JSON...');
        console.log('[CommunityService] Blob size:', response.size, 'bytes');
        console.log('[CommunityService] Blob type:', response.type);
        
        const text = await response.text();
        console.log('[CommunityService] Blob text content:', text);
        
        try {
          const parsedResponse = JSON.parse(text) as PageCommunityResDto;
          console.log('[CommunityService] ✅ Successfully parsed Blob as JSON');
          console.log('[CommunityService] Parsed response:', parsedResponse);
          
          const communitiesList = parsedResponse.content || [];
          console.log('[CommunityService] Setting communities signal with', communitiesList.length, 'items');
          
          communitiesList.forEach((community: CommunityResDto, index: number) => {
            console.log(`[CommunityService] Community ${index}:`, {
              id: community.id,
              title: community.title,
              nbrMembers: community.nbrMembers,
              moderatorId: community.moderatorId
            });
          });

          this.communities.set(communitiesList);
          console.log('[CommunityService] Communities signal updated successfully');
          return;
        } catch (parseError) {
          console.error('[CommunityService] ❌ Failed to parse Blob as JSON:', parseError);
          throw new Error(`Failed to parse response: ${parseError}`);
        }
      }

      // Handle normal JSON response
      console.log('[CommunityService] Response is JSON (not Blob)');
      console.log('[CommunityService] Response content:', response.content);
      console.log('[CommunityService] Response totalElements:', response.totalElements);
      console.log('[CommunityService] Response totalPages:', response.totalPages);
      console.log('[CommunityService] Response empty:', response.empty);

      // Extract content from paginated response
      const communitiesList = response.content || [];
      console.log('[CommunityService] Setting communities signal with', communitiesList.length, 'items');
      
      communitiesList.forEach((community: CommunityResDto, index: number) => {
        console.log(`[CommunityService] Community ${index}:`, {
          id: community.id,
          title: community.title,
          nbrMembers: community.nbrMembers,
          moderatorId: community.moderatorId
        });
      });

      this.communities.set(communitiesList);
      console.log('[CommunityService] Communities signal updated successfully');
    } catch (err) {
      const errorMessage = this.extractErrorMessage(err);
      this.error.set(errorMessage);
      
      console.error('[CommunityService] ❌ ERROR loading communities:', err);
      console.error('[CommunityService] Error type:', typeof err);
      console.error('[CommunityService] Error constructor:', err?.constructor?.name);
      
      if (err && typeof err === 'object' && 'error' in err) {
        console.error('[CommunityService] Backend error details:', (err as any).error);
        if ((err as any).error instanceof Blob) {
          console.error('[CommunityService] Error is Blob, attempting to parse...');
          (err as any).error.text().then((text: string) => {
            console.error('[CommunityService] Error Blob content:', text);
          });
        }
      }
      console.error('[CommunityService] Error message:', errorMessage);
      console.error('[CommunityService] Full error object:', JSON.stringify(err, null, 2));
    } finally {
      this.isLoading.set(false);
      console.log('[CommunityService] loadCommunities completed - isLoading set to false');
    }
  }

  /**
   * Fetch user's created communities
   * Updates the myCreatedCommunities signal with the result
   * Endpoint: GET /api/communities/my-created
   */
  async loadMyCreatedCommunities(params?: {
    page?: number;
    size?: number;
  }): Promise<void> {
    console.log('[CommunityService] loadMyCreatedCommunities called with params:', params);
    this.myCreatedCommunitiesLoading.set(true);
    this.myCreatedCommunitiesError.set(null);

    try {
      console.log('[CommunityService] Making API call to getMyCreatedCommunities...');
      
      const response: any = await firstValueFrom(
        this.communityController.getMyCreatedCommunities(
          params?.page ?? 0,
          params?.size ?? 100,
          'id',
          'asc'
        )
      );

      console.log('[CommunityService] Created Communities API Response received');
      console.log('[CommunityService] Response type:', typeof response);
      console.log('[CommunityService] Is Blob?', response instanceof Blob);

      // Handle Blob response
      if (response instanceof Blob) {
        console.warn('[CommunityService] ⚠️ Response is a Blob! Converting to JSON...');
        
        const text = await response.text();
        console.log('[CommunityService] Blob text content:', text);
        
        try {
          const parsedResponse = JSON.parse(text) as PageCommunityResDto;
          console.log('[CommunityService] ✅ Successfully parsed Blob as JSON');
          
          const communitiesList = parsedResponse.content || [];
          console.log('[CommunityService] Setting myCreatedCommunities signal with', communitiesList.length, 'items');
          
          this.myCreatedCommunities.set(communitiesList);
          return;
        } catch (parseError) {
          console.error('[CommunityService] ❌ Failed to parse Blob as JSON:', parseError);
          throw new Error(`Failed to parse response: ${parseError}`);
        }
      }

      // Handle normal JSON response
      const communitiesList = response.content || [];
      console.log('[CommunityService] Setting myCreatedCommunities signal with', communitiesList.length, 'items');
      
      communitiesList.forEach((community: CommunityResDto, index: number) => {
        console.log(`[CommunityService] Created Community ${index}:`, {
          id: community.id,
          title: community.title,
          nbrMembers: community.nbrMembers,
          moderatorId: community.moderatorId
        });
      });

      this.myCreatedCommunities.set(communitiesList);
      console.log('[CommunityService] myCreatedCommunities signal updated successfully');
    } catch (err) {
      const errorMessage = this.extractErrorMessage(err);
      this.myCreatedCommunitiesError.set(errorMessage);
      
      console.error('[CommunityService] ❌ ERROR loading created communities:', err);
      console.error('[CommunityService] Error message:', errorMessage);
    } finally {
      this.myCreatedCommunitiesLoading.set(false);
      console.log('[CommunityService] loadMyCreatedCommunities completed');
    }
  }

  /**
   * Fetch user's joined communities
   * Updates the myJoinedCommunities signal with the result
   * Endpoint: GET /api/communities/my
   */
  async loadMyJoinedCommunities(params?: {
    page?: number;
    size?: number;
  }): Promise<void> {
    console.log('[CommunityService] loadMyJoinedCommunities called with params:', params);
    this.myJoinedCommunitiesLoading.set(true);
    this.myJoinedCommunitiesError.set(null);

    try {
      console.log('[CommunityService] Making API call to getMyCommunities...');
      
      const response: any = await firstValueFrom(
        this.communityController.getMyCommunities(
          params?.page ?? 0,
          params?.size ?? 100,
          'id',
          'asc'
        )
      );

      console.log('[CommunityService] Joined Communities API Response received');
      console.log('[CommunityService] Response type:', typeof response);
      console.log('[CommunityService] Is Blob?', response instanceof Blob);

      // Handle Blob response
      if (response instanceof Blob) {
        console.warn('[CommunityService] ⚠️ Response is a Blob! Converting to JSON...');
        
        const text = await response.text();
        console.log('[CommunityService] Blob text content:', text);
        
        try {
          const parsedResponse = JSON.parse(text) as PageCommunityResDto;
          console.log('[CommunityService] ✅ Successfully parsed Blob as JSON');
          
          const communitiesList = parsedResponse.content || [];
          console.log('[CommunityService] Setting myJoinedCommunities signal with', communitiesList.length, 'items');
          
          this.myJoinedCommunities.set(communitiesList);
          return;
        } catch (parseError) {
          console.error('[CommunityService] ❌ Failed to parse Blob as JSON:', parseError);
          throw new Error(`Failed to parse response: ${parseError}`);
        }
      }

      // Handle normal JSON response
      const communitiesList = response.content || [];
      console.log('[CommunityService] Setting myJoinedCommunities signal with', communitiesList.length, 'items');
      
      communitiesList.forEach((community: CommunityResDto, index: number) => {
        console.log(`[CommunityService] Joined Community ${index}:`, {
          id: community.id,
          title: community.title,
          nbrMembers: community.nbrMembers,
          moderatorId: community.moderatorId
        });
      });

      this.myJoinedCommunities.set(communitiesList);
      console.log('[CommunityService] myJoinedCommunities signal updated successfully');
    } catch (err) {
      const errorMessage = this.extractErrorMessage(err);
      this.myJoinedCommunitiesError.set(errorMessage);
      
      console.error('[CommunityService] ❌ ERROR loading joined communities:', err);
      console.error('[CommunityService] Error message:', errorMessage);
    } finally {
      this.myJoinedCommunitiesLoading.set(false);
      console.log('[CommunityService] loadMyJoinedCommunities completed');
    }
  }

  /**
   * Get a single community by ID
   */
  async getCommunityById(id: number): Promise<CommunityResDto | null> {
    console.log('[CommunityService] getCommunityById called with id:', id);
    
    try {
      console.log('[CommunityService] Making API call to getCommunityById...');
      let response: any = await firstValueFrom(this.communityController.getCommunityById(id));
      
      console.log('[CommunityService] Community response received');
      console.log('[CommunityService] Response type:', typeof response);
      console.log('[CommunityService] Is Blob?', response instanceof Blob);

      // Handle Blob response
      if (response instanceof Blob) {
        console.warn('[CommunityService] ⚠️ Community response is a Blob! Converting to JSON...');
        console.log('[CommunityService] Blob size:', response.size, 'bytes');
        console.log('[CommunityService] Blob type:', response.type);
        
        const text = await response.text();
        console.log('[CommunityService] Blob text content:', text);
        response = JSON.parse(text);
        console.log('[CommunityService] ✅ Successfully parsed Blob as JSON');
      }

      console.log('[CommunityService] Community fetched successfully:', response);
      return response;
    } catch (err) {
      const errorMessage = this.extractErrorMessage(err);
      console.error('[CommunityService] ❌ ERROR fetching community:', err);
      console.error('[CommunityService] Error type:', typeof err);
      
      if (err && typeof err === 'object' && 'error' in err) {
        console.error('[CommunityService] Backend error details:', (err as any).error);
        if ((err as any).error instanceof Blob) {
          console.error('[CommunityService] Error is Blob, attempting to parse...');
          (err as any).error.text().then((text: string) => {
            console.error('[CommunityService] Error Blob content:', text);
          });
        }
      }
      console.error('[CommunityService] Error message:', errorMessage);
      return null;
    }
  }

  /**
   * Clear the communities list and state
   */
  clear(): void {
    console.log('[CommunityService] clear called - resetting state');
    this.communities.set([]);
    this.error.set(null);
    this.isLoading.set(false);
  }

  /**
   * Extract meaningful error message from various error types
   */
  private extractErrorMessage(err: any): string {
    console.log('[CommunityService] extractErrorMessage called with error:', err);
    console.log('[CommunityService] Error is HttpErrorResponse?', err instanceof HttpErrorResponse);
    
    // Handle HttpErrorResponse specifically
    if (err instanceof HttpErrorResponse) {
      console.log('[CommunityService] HTTP Status:', err.status);
      console.log('[CommunityService] HTTP StatusText:', err.statusText);
      console.log('[CommunityService] HTTP Error body:', err.error);
      
      if (err.status === 401) {
        return 'Unauthorized: Please log in again';
      }
      if (err.status === 403) {
        return 'Forbidden: You do not have permission to access communities';
      }
      if (err.status === 404) {
        return 'Not found: Community endpoint not available';
      }
      if (err.status === 500) {
        const backendMessage = err.error?.message || err.error?.error || 'Internal Server Error';
        console.log('[CommunityService] 500 Backend message:', backendMessage);
        return `Server error (500): ${backendMessage}`;
      }
      if (err.status >= 400) {
        return `HTTP Error ${err.status}: ${err.statusText || err.message}`;
      }
    }
    
    // Check for HTTP error status
    if (err?.status) {
      console.log('[CommunityService] HTTP Status:', err.status);
      if (err.status === 401) {
        return 'Unauthorized: Please log in again';
      }
      if (err.status === 403) {
        return 'Forbidden: You do not have permission to access communities';
      }
      if (err.status === 404) {
        return 'Not found: Community does not exist';
      }
      if (err.status >= 500) {
        return `Server error (${err.status}): ${err.error?.message || 'Please try again later'}`;
      }
    }
    
    // Check for backend error response
    if (err?.error?.message) {
      console.log('[CommunityService] Backend error message found');
      return `Backend error: ${err.error.message}`;
    }
    
    // Check for Blob error
    if (err?.error instanceof Blob) {
      console.log('[CommunityService] Error response is Blob');
      return 'Server error: Could not parse response (received Blob instead of JSON)';
    }
    
    // Check for HTTP error message
    if (err?.message) {
      console.log('[CommunityService] HTTP error message found');
      return err.message;
    }
    
    // Check for error string
    if (typeof err === 'string') {
      console.log('[CommunityService] Error is string');
      return err;
    }
    
    // Default fallback
    console.log('[CommunityService] Using default error message');
    return 'An unknown error occurred while loading communities';
  }
}
