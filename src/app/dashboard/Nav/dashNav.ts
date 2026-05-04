import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { DashboardSidebarComponent } from './dashboard-sidebar';
import { DashboardRightSidebarComponent } from './promodoro_sidebar';
import { AiAssistant } from './ai-assistant';
import { UserContextService } from '../../user-context.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

const AUTH_TOKEN_KEY = 'token';
 
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DashboardSidebarComponent,
    DashboardRightSidebarComponent,
    RouterOutlet,
    CommonModule,
    AiAssistant,
  ],
  template: `
    <div class="min-h-screen bg-slate-50">
      <div class="w-full px-4 py-6">
        <div
          class="grid grid-cols-1 gap-8"
          [ngClass]="isFocusRoom()
            ? 'lg:grid-cols-[280px_1fr]'
            : 'lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]'"
        >
          <app-dashboard-sidebar
            [displayName]="displayName()"
            [level]="level()"
            [xp]="xp()"
            [pfp]="pfpUrl()"
            (navigate)="handleSidebarNavigation($event)"
            (logout)="handleLogout()"
          />

          <div class="flex flex-col gap-4 w-full">
            <router-outlet />
          </div>

          @if (!isFocusRoom()) {
            <app-dashboard-right-sidebar />
          }
        </div>
      </div>
    </div>

    <!-- Floating AI button -->
    <button
      (click)="aiOpen.set(true)"
      aria-label="Open AI Assistant"
      class="fixed bottom-7 right-7 z-50 w-13 h-13 rounded-full border-none
             bg-gradient-to-br from-indigo-500 to-violet-500
             shadow-[0_4px_20px_rgba(99,102,241,0.45)]
             flex items-center justify-center text-white
             transition-all duration-200
             hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_8px_28px_rgba(99,102,241,0.55)]
             active:scale-95"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3l1.88 5.76a1 1 0 00.95.69H21l-5.12 3.72a1 1 0 00-.36 1.12L17.4 20l-5.12-3.72a1 1 0 00-1.16 0L6 20l1.88-5.71a1 1 0 00-.36-1.12L2 9.45h6.17a1 1 0 00.95-.69L12 3z"/>
      </svg>
    </button>

    <!-- Backdrop -->
    @if (aiOpen()) {
      <div
        class="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        (click)="aiOpen.set(false)"
      ></div>
    }

    <!-- AI panel -->
    <app-ai-assistant
      [open]="aiOpen()"
      (closePanel)="aiOpen.set(false)"
    />
  `
})
export class DashboardComponent {
  private readonly userContext = inject(UserContextService);
  private readonly router = inject(Router);

  readonly user = this.userContext.user;
  readonly aiOpen = signal(false);

  readonly displayName = computed(() => {
    const user = this.user();
    console.log('User data in displayName computed:', user);
    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return fullName || user?.username || 'Student';
  });

  readonly username  = computed(() => this.user()?.username ?? '');
  readonly pfp       = computed(() => this.user()?.pfp ?? undefined);
  readonly pfpUrl    = computed(() => {
    const p = this.pfp();
    return p ? `${environment.apiBaseUrl}/uploads/${p}` : undefined;
  });
  readonly roleLabel = computed(() => this.user()?.role ?? '');
  readonly xp        = computed(() => this.user()?.xpPts ?? 0);
  readonly level     = computed(() => this.user()?.level ?? 1);

  isFocusRoom(): boolean {
    return this.router.url.includes('/focus-room');
  }

  handleLogout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    this.userContext.clear();
    this.router.navigateByUrl('/auth/login');
  }

    handleSidebarNavigation(section: string): void {
    const routes: Record<string, string> = {
        'dashboard':   '/dashboard/feed',
        'feed':        '/dashboard/feed',
        'explore':     '/dashboard/explore',
        'communities': '/dashboard/communities',
        'my-created':  '/dashboard/my-created',
        'focus':       '/dashboard/focus-room',
        'profile':     '/dashboard/profile',
        'settings':    '/dashboard/settings',
        'support':     '/dashboard/support',
        'followed':    '/dashboard/followed',
        'bookmarks':   '/dashboard/bookmarks',
    };

    const target = routes[section] ?? '/dashboard/feed';
    this.router.navigateByUrl(target);
}
}