import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { AuthFacadeService } from '../../api/facades';
import { UserContextService } from '../../services/user-context.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="min-h-dvh flex items-center justify-center bg-slate-200">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p class="mt-4 text-slate-600">Completing sign in...</p>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly authFacade = inject(AuthFacadeService);
  private readonly userContext = inject(UserContextService);
  private readonly http = inject(HttpClient);

  async ngOnInit(): Promise<void> {
    try {
      const token = await this.supabase.getSessionToken();

      if (!token) {
        throw new Error('Failed to get session from Supabase');
      }

      console.log('[AuthCallback] Supabase token received, syncing with backend...');

      const response: any = await firstValueFrom(
        this.http.get(`${environment.apiBaseUrl}/api/auth/sync`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      );

      console.log('[AuthCallback] Backend sync response:', response);

      if (!response || !response.token) {
        throw new Error('Backend did not return a valid token from sync endpoint');
      }

      localStorage.setItem('token', response.token);

      await this.supabase.signOut();

      const user = await this.userContext.loadMe();

      console.log('[AuthCallback] loadMe result:', user);

      if (!user) {
        throw new Error('Failed to load user profile from backend after sync');
      }

      const targetRoute = this.userContext.getDefaultRouteByRole();
      await this.router.navigateByUrl(targetRoute);

    } catch (err: any) {
      console.error('[AuthCallback] Error:', err);
      localStorage.removeItem('token');
      this.userContext.clear();
      await this.supabase.signOut();
      await this.router.navigate(['/auth/login']);
    }
  }
}
