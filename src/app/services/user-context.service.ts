import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { UserService } from '../services/user.service';
import { UserUI } from '../api/facades';

const AUTH_TOKEN_KEY = 'token';

@Injectable({ providedIn: 'root' })
export class UserContextService {
  private readonly userService = inject(UserService);

  readonly user = signal<UserUI | null>(null);
  readonly isLoading = signal(false);

  // ─── LIFECYCLE ───────────────────────────────────────────────────────────

  async initializeFromStoredToken(): Promise<void> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)?.trim();
    if (!token) {
      this.user.set(null);
      return;
    }
    await this.loadMe();
  }

  // ─── DATA LOADING ────────────────────────────────────────────────────────

  async loadMe(): Promise<UserUI | null> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.userService.getMe());
      const user = await this.normalizeResponse(response);
      this.user.set(user);
      return user;
    } catch (error) {
      console.error('[UserContext] loadMe error:', error);
      this.user.set(null);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // ─── ACTIONS ─────────────────────────────────────────────────────────────

  clear(): void {
    this.user.set(null);
  }

  setUser(user: UserUI): void {
    this.user.set(user);
  }

  // Returns the default dashboard route based on the current user's role.
  getDefaultRouteByRole(): string {
    const role = this.user()?.role;
    if (role === 'Admin') {
      return '/dashboard/admin';
    }
    if (role === 'Client') {
      return '/dashboard/client';
    }
    return '/dashboard';
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  private async normalizeResponse(response: UserUI | Blob): Promise<UserUI | null> {
    if (response instanceof Blob) {
      try {
        const text = await response.text();
        return JSON.parse(text) as UserUI;
      } catch {
        return null;
      }
    }
    return response ?? null;
  }
}
