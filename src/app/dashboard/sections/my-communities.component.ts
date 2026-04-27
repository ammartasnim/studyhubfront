import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-communities',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[360px]">
      <p class="text-sm font-semibold uppercase tracking-wide text-indigo-600">My Communities</p>
      <h2 class="mt-2 text-2xl font-bold text-slate-900">Communities</h2>
    </section>
  `
})
export class MyCommunitiesComponent {}
