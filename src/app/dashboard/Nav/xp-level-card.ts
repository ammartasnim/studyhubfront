import { Component, input } from '@angular/core';

@Component({
  selector: 'app-xp-level-card',
  standalone: true,
  template: `
    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="text-lg font-semibold text-slate-900">Progress</h2>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">Level</p>
          <p class="mt-1 text-3xl font-bold text-slate-900">{{ levelValue() }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-slate-500">XP</p>
          <p class="mt-1 text-3xl font-bold text-slate-900">{{ xpValue() }}</p>
        </div>
      </div>
    </section>
  `
})
export class XpLevelCardComponent {
  readonly levelValue = input<number>(0);
  readonly xpValue = input<number>(0);
}
