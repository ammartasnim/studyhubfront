import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserContextService } from '../../services/user-context.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
 <aside class="hidden lg:flex flex-col gap-6 max-h-[calc(100vh-3rem)] overflow-y-auto
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-thumb]:bg-slate-300
              [&::-webkit-scrollbar-thumb]:rounded-full">
      <!-- Profile Card -->
      <div class="rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 p-5 text-white">
        <!-- Avatar -->
        <div class="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
          <img [src]="pfp()" alt="Profile Picture" class="h-full w-full rounded-full object-cover">
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
          (click)="navigateTo('explore')"
          class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
        >
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span class="font-medium">Explore Communities</span>
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
          (click)="navigateTo('suggestedFriends')"
            class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"

        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="9" cy="8" r="3"/>
  <path d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
  <line x1="19" y1="8" x2="19" y2="14"/>
  <line x1="16" y1="11" x2="22" y2="11"/>
</svg>
          <span class="font-medium">Friends</span>
          
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
        <button
          (click)="navigateTo('chat')"
          class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span class="font-medium">Chat</span>
        </button>
      </nav>
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
          (click)="handleLogout()"
          class="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-indigo-50 transition-colors border-b border-slate-200 last:border-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <span class="font-medium">Logout</span>

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
  userContext: UserContextService=inject(UserContextService);
  router=inject(Router);

  constructor() {
    
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

    this.navigate.emit(section);
  }
    handleLogout(): void {
    localStorage.removeItem('token');
    this.userContext.clear();
    this.router.navigateByUrl('/auth/login');
  }

}
