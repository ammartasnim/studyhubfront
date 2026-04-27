import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-how-step',
  standalone: true,
  template: `
    <article class="text-center">
      <div class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-r text-5xl font-bold text-white" [class]="gradientClass">{{ number }}</div>
      <h3 class="mt-6 text-5xl font-bold text-slate-900">{{ title }}</h3>
      <p class="mx-auto mt-4 max-w-md text-2xl leading-relaxed text-slate-700">{{ description }}</p>
    </article>
  `
})
export class HowStepComponent {
  @Input({ required: true }) number!: string;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
  @Input({ required: true }) gradientClass!: string;
}
