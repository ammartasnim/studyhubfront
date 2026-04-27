import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="hidden lg:flex flex-col gap-6 sticky top-6 h-fit">
      <!-- Profile Card -->
      <div class="rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 p-5 text-white">
        <!-- Avatar -->
        <div class="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
          <span class="text-2xl font-bold">{{ getInitials() }}</span>
        </div>

        <!-- User Info -->
        <h3 class="font-semibold text-lg">{{ displayName() }}</h3>
        <p class="text-sm text-white/80 mb-4">Level {{ level() }}</p>

        <!-- Progress Bar -->
        <div class="mb-4">
          <div class="h-2 bg-white/20 rounded-full overflow-hidden">
            <div class="h-full bg-white rounded-full" [style.width.%]="xpPercentage()"></div>
          </div>
        </div>

        <!-- XP -->
        <p class="text-sm font-medium">{{ xp() }} XP</p>
      </div>

      <!-- Navigation -->
      <nav class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <button
          (click)="navigateTo('feed')"
          class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
        >
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span class="font-medium">Feed</span>
        </button>
        <button
          (click)="navigateTo('profile')"
          class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14a4 4 0 100-8 4 4 0 000 8zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
          </svg>
          <span class="font-medium">My Profile</span>
        </button>
        <button
          (click)="navigateTo('communities')"
          class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <span class="font-medium">My Communities</span>
        </button>
        <button
          (click)="navigateTo('my-created')"
          class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="font-medium">Created Communities</span>
        </button>
        <button
          (click)="navigateTo('focus')"
          class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-medium">Focus Room</span>
        </button>
      </nav>

      <!-- Quick Access -->
      <div>
        <p class="text-xs font-semibold uppercase text-slate-500 px-4 mb-2">Quick Access</p>
        <nav class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <button
            (click)="navigateTo('followed')"
            class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span class="font-medium">Followed Peers</span>
          </button>
          <button
            (click)="navigateTo('bookmarks')"
            class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span class="font-medium">Bookmarked Resources</span>
          </button>
        </nav>
      </div>

      <!-- Settings & Support -->
      <nav class="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <button
          (click)="navigateTo('settings')"
          class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="font-medium">Settings</span>
        </button>
        <button
          (click)="navigateTo('support')"
          class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5-4a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span class="font-medium">Support</span>
        </button>
      </nav>
    </aside>
  `,
  styles: []
})
export class DashboardSidebarComponent {
  readonly displayName = input<string>('');
  readonly level = input<number>(0);
  readonly xp = input<number>(0);
  readonly pfp = input<string | undefined>(undefined);

  readonly navigate = output<string>();

  constructor() {
    console.log('[DashboardSidebarComponent] Constructor called - initializing component');
  }

  xpPercentage = () => Math.min((this.xp() / 1000) * 100, 100);

  getInitials(): string {
    const name = this.displayName();
    if (!name) return '?';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  }

  navigateTo(section: string): void {
    console.log('[DashboardSidebarComponent] navigateTo called with section:', section);
    this.navigate.emit(section);
  }
}
