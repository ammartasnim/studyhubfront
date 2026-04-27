import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AcademicFeedComponent } from './components/academic-feed.component';
import { DashboardHeaderComponent } from './components/dashboard-header.component';
import { DashboardSidebarComponent } from './components/dashboard-sidebar.component';
import { DashboardRightSidebarComponent } from './components/dashboard-right-sidebar.component';
import { UserContextService } from '../user-context.service';

const AUTH_TOKEN_KEY = 'token';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DashboardHeaderComponent,
    DashboardSidebarComponent,
    DashboardRightSidebarComponent,
    AcademicFeedComponent
  ],
  template: `
    <div class="min-h-screen bg-slate-50">
      <div class="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <!-- Main Layout Grid -->
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]">
          
          <!-- Left Sidebar -->
          <app-dashboard-sidebar
            [displayName]="displayName()"
            [level]="level()"
            [xp]="xp()"
            [pfp]="pfp()"
            (navigate)="handleSidebarNavigation($event)"
          />

          <!-- Middle Content (Feed) -->
          <div class="flex flex-col gap-6">
            <app-dashboard-header
              [displayName]="displayName()"
              [roleLabel]="roleLabel()"
              [username]="username()"
              [pfp]="pfp()"
              (logout)="handleLogout()"
            />
            
            <app-academic-feed />
          </div>

          <!-- Right Sidebar -->
          <app-dashboard-right-sidebar />
          
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

  handleLogout(): void {
    console.log('[Dashboard] Logout triggered');
    localStorage.removeItem(AUTH_TOKEN_KEY);
    this.userContext.clear();
    this.router.navigateByUrl('/login');
  }

  handleSidebarNavigation(section: string): void {
    console.log('[Dashboard] Sidebar navigation to:', section);
    // Add routing logic if needed
  }
}
