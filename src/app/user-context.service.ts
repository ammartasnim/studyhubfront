import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { UserService } from './services/user.service';
import { UserUI } from './api/facades';

const AUTH_TOKEN_KEY = 'token';

@Injectable({ providedIn: 'root' })
export class UserContextService {
  private readonly userService = inject(UserService);

  readonly user = signal<UserUI | null>(null);
  readonly isLoading = signal(false);

  async initializeFromStoredToken(): Promise<void> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)?.trim();
    console.log('[UserContext] initializeFromStoredToken - token exists:', !!token);

    if (!token) {

      this.user.set(null);
      return;
    }

    await this.loadMe();
  }

  async loadMe(): Promise<UserUI | null> {
   
    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(this.userService.getMe());
      const user = await this.normalizeResponse(response);
      console.log('[UserContext] loadMe success - user loaded:', user);
      this.user.set(user);
      return user;
    } catch (error) {
      console.error('[UserContext] loadMe error:', error);
      this.user.set(null);  
      return null;
    } finally {
      this.isLoading.set(false);
      console.log('[UserContext] loadMe finished - isLoading set to false');
    }
  }

  clear(): void {
    console.log('[UserContext] clear called - clearing user');
    this.user.set(null);
  }

  setUser(user: UserUI): void {
    console.log('[UserContext] setUser called with:', user);
    this.user.set(user);
  }

  getDefaultRouteByRole(): string {
    const role = this.user()?.role;
    console.log('[UserContext] getDefaultRouteByRole - current role:', role);

    // Handle both string and enum values
    if (role === 'Admin') {
      console.log('[UserContext] Returning admin route');
      return '/dashboard/admin';
    }

    if (role === 'Client') {
      console.log('[UserContext] Returning client route');
      return '/dashboard/client';
    }

    console.log('[UserContext] Returning default route');
    return '/dashboard';
  }

  private async normalizeResponse(response: UserUI | Blob): Promise<UserUI | null> {
    if (response instanceof Blob) {
      console.warn('[UserContext] Response is a Blob, parsing as JSON');
      try {
        const text = await response.text();
        const parsed = JSON.parse(text) as UserUI;
        return parsed;
      } catch (error) {
        console.error('[UserContext] Failed to parse Blob as JSON:', error);
        return null;
      }
    }

    return response ?? null;
  }
}
