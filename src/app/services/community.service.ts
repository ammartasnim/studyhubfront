import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommunityFacadeService, CommunityUI } from '../api/facades';

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly communityFacade = inject(CommunityFacadeService);

  // ─── STATE ───────────────────────────────────────────────────────────────

  readonly communities = signal<CommunityUI[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly myJoinedCommunities = signal<CommunityUI[]>([]);
  readonly myJoinedCommunitiesLoading = signal(false);
  readonly myJoinedCommunitiesError = signal<string | null>(null);

  readonly myCreatedCommunities = signal<CommunityUI[]>([]);
  readonly myCreatedCommunitiesLoading = signal(false);
  readonly myCreatedCommunitiesError = signal<string | null>(null);

  // ─── COMPUTED ────────────────────────────────────────────────────────────

  readonly isEmpty = computed(() => this.communities().length === 0);
  readonly hasError = computed(() => this.error() !== null);
  readonly isMyJoinedCommunitiesEmpty = computed(() => this.myJoinedCommunities().length === 0);
  readonly hasMyJoinedCommunitiesError = computed(() => this.myJoinedCommunitiesError() !== null);
  readonly isMyCreatedCommunitiesEmpty = computed(() => this.myCreatedCommunities().length === 0);
  readonly hasMyCreatedCommunitiesError = computed(() => this.myCreatedCommunitiesError() !== null);

  // ─── DATA LOADING ────────────────────────────────────────────────────────

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

  // ─── ACTIONS ─────────────────────────────────────────────────────────────

  async getCommunityById(id: number): Promise<CommunityUI | null> {
    console.log('[CommunityService] getCommunityById called with id:', id);
    
    try {
      return await firstValueFrom(this.communityFacade.getById(id));
    } catch (err: any) {
      console.error('[CommunityService] Error fetching community:', err);
      return null;
    }
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  clear(): void {
    console.log('[CommunityService] clear called - resetting state');
    this.communities.set([]);
    this.error.set(null);
    this.isLoading.set(false);
  }
}
