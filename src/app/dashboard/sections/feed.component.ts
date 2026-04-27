import { Component } from '@angular/core';
import { AcademicFeedComponent } from '../components/academic-feed.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [AcademicFeedComponent],
  template: `
    <app-academic-feed />
  `
})
export class FeedComponent {}
