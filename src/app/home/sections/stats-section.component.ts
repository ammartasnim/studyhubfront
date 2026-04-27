import { Component } from '@angular/core';

@Component({
  selector: 'app-stats-section',
  standalone: true,
  template: `
    <section class="px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white px-6 py-10 sm:px-10">
        <div class="grid gap-8 text-center sm:grid-cols-3">
          <div>
            <p class="text-6xl font-extrabold text-indigo-600">50K+</p>
            <p class="mt-2 text-3xl text-slate-700">Active Students</p>
          </div>
          <div>
            <p class="text-6xl font-extrabold text-violet-600">200+</p>
            <p class="mt-2 text-3xl text-slate-700">Study Communities</p>
          </div>
          <div>
            <p class="text-6xl font-extrabold text-pink-600">1M+</p>
            <p class="mt-2 text-3xl text-slate-700">Posts & Resources</p>
          </div>
        </div>
      </div>
    </section>
  `
})
export class StatsSectionComponent {}
