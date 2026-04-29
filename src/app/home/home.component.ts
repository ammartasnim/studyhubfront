import { Component } from '@angular/core';

import { CtaSectionComponent } from './sections/cta-section.component';
import { FeaturesSectionComponent } from './sections/features-section.component';
import { HeroSectionComponent } from './sections/hero-section.component';
import { HowItWorksSectionComponent } from './sections/how-it-works-section.component';
import { PublicNavbarComponent } from './sections/public-navbar.component';
import { StatsSectionComponent } from './sections/stats-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    PublicNavbarComponent,
    HeroSectionComponent,
    FeaturesSectionComponent,
    StatsSectionComponent,
    HowItWorksSectionComponent,
    CtaSectionComponent
  ],
  template: `
  <main class="min-h-dvh bg-[#e9ecf5] text-slate-900">
  <app-public-navbar></app-public-navbar>
  <app-hero-section></app-hero-section>
  <app-features-section></app-features-section>
  <app-stats-section></app-stats-section>
  <app-how-it-works-section></app-how-it-works-section>
  <app-cta-section></app-cta-section>
</main>
  `
})
export class HomeComponent {}
