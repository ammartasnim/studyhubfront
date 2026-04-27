import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="border-b border-slate-200 bg-white/90">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a routerLink="/" class="flex items-center gap-3">
          <div class="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500">
            <svg class="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3.2L13.7 8.3L18.8 10L13.7 11.7L12 16.8L10.3 11.7L5.2 10L10.3 8.3L12 3.2Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M18.8 4.4L19.3 6L20.9 6.5L19.3 7L18.8 8.6L18.3 7L16.7 6.5L18.3 6L18.8 4.4Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <span class="text-2xl font-bold text-slate-900">Academic Platform</span>
        </a>

        <nav class="flex items-center gap-4">
          <a routerLink="/auth/login" class="text-xl font-semibold text-slate-700 transition hover:text-slate-900">Log In</a>
          <a routerLink="/auth/register" class="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-500 px-7 py-3 text-xl font-semibold text-white shadow-md transition hover:-translate-y-0.5">Get Started</a>
        </nav>
      </div>
    </header>
  `
})
export class PublicNavbarComponent {}
