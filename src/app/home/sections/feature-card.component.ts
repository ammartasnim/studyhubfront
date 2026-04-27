import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-feature-card',
  standalone: true,
  template: `
    <article class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="grid h-16 w-16 place-items-center rounded-2xl" [class]="iconBackgroundClass">
        <span class="text-3xl" [class]="iconClass">{{ icon }}</span>
      </div>
      <h3 class="mt-6 text-[2rem] font-bold leading-tight text-slate-900">{{ title }}</h3>
      <p class="mt-3 text-xl leading-relaxed text-slate-700">{{ description }}</p>
    </article>
  `
})
export class FeatureCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) iconClass!: string;
  @Input({ required: true }) iconBackgroundClass!: string;
}
