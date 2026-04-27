import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="px-4 pb-14 pt-6 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-16 text-center text-white sm:px-8">
        <h2 class="text-4xl font-extrabold sm:text-6xl">Ready to Transform Your Learning?</h2>
        <p class="mx-auto mt-5 max-w-3xl text-2xl text-white/90">
          Join thousands of students already succeeding with our platform.
        </p>
        <a routerLink="/auth/register" class="mt-10 inline-flex rounded-2xl bg-white px-10 py-4 text-2xl font-semibold text-indigo-600 transition hover:bg-slate-100">
          Create Free Account
        </a>
      </div>
    </section>
  `
})
export class CtaSectionComponent {}
