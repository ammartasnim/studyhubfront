import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="px-4 pb-8 pt-16 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-5xl text-center">
        <h1 class="text-5xl font-extrabold leading-tight text-slate-900 sm:text-6xl lg:text-7xl">
          Your Academic Success,
          <span class="block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">All in One Place</span>
        </h1>
        <p class="mx-auto mt-7 max-w-4xl text-2xl leading-relaxed text-slate-700">
          A single pane of glass for students. Connect with peers, manage tasks, get AI assistance, and achieve your academic goals with focus and efficiency.
        </p>

        <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a routerLink="/auth/register" class="rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-10 py-4 text-2xl font-bold text-white shadow-[0_10px_24px_rgba(99,102,241,0.35)] transition hover:-translate-y-0.5">Start Learning Free</a>
          <a routerLink="/auth/login" class="rounded-2xl border border-slate-300 bg-white px-10 py-4 text-2xl font-semibold text-slate-800 transition hover:bg-slate-50">Sign In</a>
        </div>
      </div>
    </section>
  `
})
export class HeroSectionComponent {}
