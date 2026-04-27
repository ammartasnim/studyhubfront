import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <!-- Profile Banner Background -->
      <div class="h-32 bg-gradient-to-r from-indigo-600 to-fuchsia-600"></div>

      <!-- Profile Info Section -->
      <div class="px-5 pb-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-16">
          <!-- Profile Picture and Info -->
          <div class="flex items-end gap-4">
            <!-- Profile Picture -->
            <div class="h-32 w-32 rounded-2xl border-4 border-white bg-slate-200 shadow-lg overflow-hidden flex items-center justify-center flex-shrink-0">
              @if (pfp()) {
                <img [src]="pfp()" [alt]="displayName()" class="w-full h-full object-cover" />
              } @else {
                <div class="w-full h-full bg-gradient-to-br from-indigo-400 to-fuchsia-400 flex items-center justify-center">
                  <span class="text-3xl font-bold text-white">{{ getInitials() }}</span>
                </div>
              }
            </div>

            <!-- User Info -->
            <div class="mb-2">
              <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Welcome back</p>
              <h1 class="text-2xl font-bold text-slate-900">{{ displayName() }}</h1>
              <p class="text-sm text-slate-600 mt-1">@{{ username() }}</p>
            </div>
          </div>

          <!-- Right Section: Role Badge and Logout -->
          <div class="flex items-center gap-3">
            <!-- Role Badge -->
            <span class="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
              {{ roleLabel() }}
            </span>
            
            <!-- Logout Button -->
            <button
              (click)="onLogout()"
              class="inline-flex items-center rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 hover:border-red-400 transition-colors duration-200"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DashboardHeaderComponent {
  private readonly router = inject(Router);

  readonly displayName = input<string>('');
  readonly roleLabel = input<string>('');
  readonly username = input<string>('');
  readonly pfp = input<string | undefined>(undefined);
  
  readonly logout = output<void>();

  getInitials(): string {
    const name = this.displayName();
    if (!name) return '?';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  }

  onLogout(): void {
    console.log('[Dashboard] Logout button clicked');
    this.logout.emit();
  }
}
