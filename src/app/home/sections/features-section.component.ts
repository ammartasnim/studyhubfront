import { Component } from '@angular/core';

import { FeatureCardComponent } from './feature-card.component';

@Component({
  selector: 'app-features-section',
  standalone: true,
  imports: [FeatureCardComponent],
  template: `
    <section class="px-4 pb-10 pt-10 sm:px-6 lg:px-8">
      <div class="mx-auto grid max-w-7xl gap-6 lg:grid-cols-4">
        <app-feature-card
          title="Academic Communities"
          description="Join communities, share knowledge, and collaborate with peers on your academic journey."
          icon="👥"
          iconClass="text-indigo-500"
          iconBackgroundClass="bg-indigo-100"
        ></app-feature-card>

        <app-feature-card
          title="AI Sidekick"
          description="Get instant help with summaries, explanations, and personalized study assistance."
          icon="✦"
          iconClass="text-violet-600"
          iconBackgroundClass="bg-violet-100"
        ></app-feature-card>

        <app-feature-card
          title="Task Management"
          description="Organize your coursework, set priorities, and track your progress effortlessly."
          icon="☑"
          iconClass="text-pink-600"
          iconBackgroundClass="bg-pink-100"
        ></app-feature-card>

        <app-feature-card
          title="Focus Room"
          description="Enter zen mode with Pomodoro timers and distraction-free study sessions."
          icon="◎"
          iconClass="text-emerald-600"
          iconBackgroundClass="bg-emerald-100"
        ></app-feature-card>
      </div>
    </section>
  `
})
export class FeaturesSectionComponent {}
