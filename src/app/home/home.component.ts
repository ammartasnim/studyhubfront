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
  templateUrl: './home.component.html'
})
export class HomeComponent {}
