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
      console.log('[UserContext] loadMe response:', response);
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

  clear(): void {

    this.user.set(null);
  }

  setUser(user: UserUI): void {
  
    this.user.set(user);
  }

  getDefaultRouteByRole(): string {
    const role = this.user()?.role;


    // Handle both string and enum values
    if (role === 'Admin') {
   
      return '/dashboard/admin';
    }

    if (role === 'Client') {
    
      return '/dashboard/client';
    }

   
    return '/dashboard';
  }

  private async normalizeResponse(response: UserUI | Blob): Promise<UserUI | null> {
    if (response instanceof Blob) {

      try {
        const text = await response.text();
        const parsed = JSON.parse(text) as UserUI;
        return parsed;
      } catch (error) {
        
        return null;
      }
    }

    return response ?? null;
  }
}
