import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserContextService } from '../../services/user-context.service';

const NAV_ITEMS = [
  { label: 'Statistics',    path: 'stats',       icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Users',         path: 'users',       icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { label: 'Posts',         path: 'posts',       icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Comments',      path: 'comments',    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { label: 'Communities',   path: 'communities', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
<div class="flex h-screen bg-slate-50 overflow-hidden">

  <!-- Sidebar -->
  <aside class="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0">

    <!-- Logo -->
    <div class="px-6 py-5 border-b border-slate-100">
      <p class="text-[0.6rem] font-black tracking-[0.25em] uppercase text-indigo-400 mb-0.5">StudyHub</p>
      <h1 class="text-lg font-extrabold text-slate-900 tracking-tight">Admin Panel</h1>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
      @for (item of navItems; track item.path) {
        <a [routerLink]="item.path" routerLinkActive="bg-indigo-50 text-indigo-600"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="item.icon"/>
          </svg>
          {{ item.label }}
        </a>
      }
    </nav>

    <!-- User + Logout -->
    <div class="px-3 py-4 border-t border-slate-100">
      <div class="flex items-center gap-3 px-3 py-2 mb-2">
        <div class="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
          {{ initials() }}
        </div>
        <div class="min-w-0">
          <p class="text-xs font-bold text-slate-700 truncate">{{ username() }}</p>
          <p class="text-[0.6rem] text-slate-400 uppercase tracking-wide">Admin</p>
        </div>
      </div>
      <button (click)="logout()"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Logout
      </button>
    </div>
  </aside>

  <!-- Main content -->
  <main class="flex-1 overflow-y-auto">
    <router-outlet />
  </main>

</div>
  `
})
export class AdminShell {
  private readonly userContext = inject(UserContextService);
  private readonly router = inject(Router);

  readonly navItems = NAV_ITEMS;
  readonly username = () => this.userContext.user()?.username ?? 'Admin';
  readonly initials = () => this.username().substring(0, 2).toUpperCase();

  async logout() {
    localStorage.removeItem('token');
    this.userContext.clear();
    await this.router.navigateByUrl('/auth/login');
  }
}