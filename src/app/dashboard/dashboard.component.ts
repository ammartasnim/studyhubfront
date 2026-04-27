import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { DashboardSidebarComponent } from './components/dashboard-sidebar.component';
import { DashboardRightSidebarComponent } from './components/dashboard-right-sidebar.component';
import { UserContextService } from '../user-context.service';
import { CommonModule } from '@angular/common';

const AUTH_TOKEN_KEY = 'token';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DashboardSidebarComponent, DashboardRightSidebarComponent, RouterOutlet, CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <div class="mx-auto px-4 py-6 sm:px-6 lg:px-8" 
           [ngClass]="isFocusRoom() ? 'w-full max-w-full' : 'max-w-[1600px]'">
        
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

          <div class="flex flex-col gap-6" [ngClass]="{'w-full': isFocusRoom()}">
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
    console.log('[Dashboard] Logout triggered');
    localStorage.removeItem(AUTH_TOKEN_KEY);
    this.userContext.clear();
    this.router.navigateByUrl('/login');
  }

  handleSidebarNavigation(section: string): void {
    console.log('[Dashboard] Sidebar navigation to:', section);
    const target =
      section === 'dashboard'
        ? '/dashboard/feed'
        : section === 'communities'
          ? '/dashboard/communities'
          : section === 'tasks' || section === 'focus'
            ? '/dashboard/focus-room'
            : section === 'profile'
              ? '/dashboard/profile'
              : '/dashboard/feed';

    this.router.navigateByUrl(target);
  }
}