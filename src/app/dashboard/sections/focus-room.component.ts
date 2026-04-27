import { Component } from '@angular/core';
import { FocusTimerComponent } from '../components/focus-timer.component';

@Component({
  selector: 'app-focus-room',
  standalone: true,
  imports: [FocusTimerComponent],
  template: `
    <app-focus-timer />
  `
})
export class FocusRoomComponent {}
