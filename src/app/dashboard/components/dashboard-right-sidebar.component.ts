import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PomodoroTimerComponent } from '../../pomodoro-timer/pomodoro-timer.component';

@Component({
  selector: 'app-dashboard-right-sidebar',
  standalone: true,
  imports: [CommonModule, PomodoroTimerComponent],
  template: `
    <aside class="hidden xl:flex flex-col gap-6 sticky top-6 h-fit">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <app-pomodoro-timer />
      </div>
    </aside>
  `
})
export class DashboardRightSidebarComponent {
  progress = () => 0.75; // 75% progress
}
