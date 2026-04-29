import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { DashboardSidebarComponent } from './dashboard-sidebar';
import { DashboardRightSidebarComponent } from './promodoro_sidebar';
import { UserContextService } from '../../user-context.service';
import { CommonModule } from '@angular/common';

const AUTH_TOKEN_KEY = 'token';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DashboardSidebarComponent, DashboardRightSidebarComponent, RouterOutlet, CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <div class="w-full px-4 py-6"
           [ngClass]="isFocusRoom() ? '' : ''">
        
        <div class="grid grid-cols-1 gap-8" 
             [ngClass]="isFocusRoom() 
                ? 'lg:grid-cols-[280px_1fr]' 
                : 'lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]'">
          
          <app-dashboard-sidebar
            [displayName]="displayName()"
            [level]="level()"
            [xp]="xp()"
            [pfp]="pfp()"
            (navigate)="handleSidebarNavigation($event)"
            (logout)="handleLogout()"
          />

          <div class="flex flex-col gap-4 w-full" [ngClass]="{'w-full': isFocusRoom()}">
            <router-outlet />
          </div>

          @if (!isFocusRoom()) {
            <app-dashboard-right-sidebar />
          }
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  private readonly userContext = inject(UserContextService);
  private readonly router = inject(Router);

  readonly user = this.userContext.user;

  readonly displayName = computed(() => {
    const user = this.user();
    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return fullName || user?.username || 'Student';
  });

  readonly username = computed(() => this.user()?.username ?? '');
  readonly pfp = computed(() => this.user()?.pfp ?? undefined);
  readonly roleLabel = computed(() => this.user()?.role ?? '');
  readonly xp = computed(() => this.user()?.xpPts ?? 0);
  readonly level = computed(() => this.user()?.level ?? 1);

  // Helper to determine if we are in the focus room
  isFocusRoom(): boolean {
    return this.router.url.includes('/focus-room');
  }

  handleLogout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    this.userContext.clear();
    this.router.navigateByUrl('/login');
  }

handleSidebarNavigation(section: string): void {
  const routes: Record<string, string> = {
    'dashboard':   '/dashboard/feed',
    'feed':        '/dashboard/feed',
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