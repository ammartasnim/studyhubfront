import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommunityFacadeService, CommunityUI } from '../api/facades';

/**
 * Service to manage community state using Angular Signals
 * Provides a clean abstraction over CommunityFacadeService
 * for UI components to consume community data reactively
 *
 * Endpoints:
 * - GET /api/communities - All communities (public)
 * - GET /api/communities/my - Communities joined by current user
 * - GET /api/communities/my-created - Communities created by current user
 */
@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly communityFacade = inject(CommunityFacadeService);

  // Signal state for "All Communities"
  readonly communities = signal<CommunityUI[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Signals for "My Communities" (joined)
  readonly myJoinedCommunities = signal<CommunityUI[]>([]);
  readonly myJoinedCommunitiesLoading = signal(false);
  readonly myJoinedCommunitiesError = signal<string | null>(null);

  // Signals for "My Created Communities"
  readonly myCreatedCommunities = signal<CommunityUI[]>([]);
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
      const response = await firstValueFrom(
        this.communityFacade.getAll({
          page: params?.page ?? 0,
          size: params?.size ?? 100,
          title: params?.title
        })
      );

      console.log('[CommunityService] Loaded', response.items.length, 'communities');
      this.communities.set(response.items);
    } catch (err: any) {
      console.error('[CommunityService] Error loading communities:', err);
      const message = err.message || 'Failed to load communities';
      this.error.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Fetch user's created communities
   * Updates the myCreatedCommunities signal with the result
   */
  async loadMyCreatedCommunities(params?: {
    page?: number;
    size?: number;
  }): Promise<void> {
    console.log('[CommunityService] loadMyCreatedCommunities called with params:', params);
    this.myCreatedCommunitiesLoading.set(true);
    this.myCreatedCommunitiesError.set(null);

    try {
      const response = await firstValueFrom(
        this.communityFacade.getMyCreated({
          page: params?.page ?? 0,
          size: params?.size ?? 100
        })
      );

      console.log('[CommunityService] Loaded', response.items.length, 'created communities');
      this.myCreatedCommunities.set(response.items);
    } catch (err: any) {
      console.error('[CommunityService] Error loading created communities:', err);
      const message = err.message || 'Failed to load created communities';
      this.myCreatedCommunitiesError.set(message);
    } finally {
      this.myCreatedCommunitiesLoading.set(false);
    }
  }

  /**
   * Fetch user's joined communities
   * Updates the myJoinedCommunities signal with the result
   */
  async loadMyJoinedCommunities(params?: {
    page?: number;
    size?: number;
  }): Promise<void> {
    console.log('[CommunityService] loadMyJoinedCommunities called with params:', params);
    this.myJoinedCommunitiesLoading.set(true);
    this.myJoinedCommunitiesError.set(null);

    try {
      const response = await firstValueFrom(
        this.communityFacade.getMy({
          page: params?.page ?? 0,
          size: params?.size ?? 100
        })
      );

      console.log('[CommunityService] Loaded', response.items.length, 'joined communities');
      this.myJoinedCommunities.set(response.items);
    } catch (err: any) {
      console.error('[CommunityService] Error loading joined communities:', err);
      const message = err.message || 'Failed to load joined communities';
      this.myJoinedCommunitiesError.set(message);
    } finally {
      this.myJoinedCommunitiesLoading.set(false);
    }
  }

  /**
   * Get a single community by ID
   */
  async getCommunityById(id: number): Promise<CommunityUI | null> {
    console.log('[CommunityService] getCommunityById called with id:', id);
    
    try {
      return await firstValueFrom(this.communityFacade.getById(id));
    } catch (err: any) {
      console.error('[CommunityService] Error fetching community:', err);
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
}
