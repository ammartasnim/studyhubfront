import { Component } from '@angular/core';

import { HowStepComponent } from './how-step.component';

@Component({
  selector: 'app-how-it-works-section',
  standalone: true,
  imports: [HowStepComponent],
  template: `
    <section class="px-4 pb-10 pt-14 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-7xl">
        <h2 class="text-center text-6xl font-extrabold text-slate-900">How It Works</h2>
        <div class="mt-10 grid gap-8 lg:grid-cols-3">
          <app-how-step
            number="1"
            title="Join Communities"
            description="Connect with students in your field and access a wealth of shared knowledge."
            gradientClass="from-indigo-600 to-indigo-500"
          ></app-how-step>

          <app-how-step
            number="2"
            title="Organize & Learn"
            description="Use AI assistance and task management to stay on top of your studies."
            gradientClass="from-violet-600 to-fuchsia-600"
          ></app-how-step>

          <app-how-step
            number="3"
            title="Achieve Goals"
            description="Track progress, earn badges, and reach your academic potential."
            gradientClass="from-pink-600 to-fuchsia-600"
          ></app-how-step>
        </div>
      </div>
    </section>
  `
})
export class HowItWorksSectionComponent {}
