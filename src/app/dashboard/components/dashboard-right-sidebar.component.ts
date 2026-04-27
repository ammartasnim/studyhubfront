import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PomodoroTimerComponent } from '../../pomodoro-timer/pomodoro-timer.component';

@Component({
  selector: 'app-dashboard-right-sidebar',
  standalone: true,
  imports: [CommonModule, PomodoroTimerComponent],
  template: `
    <aside class="hidden xl:flex flex-col gap-6 sticky top-6 h-fit">
      <!-- Pomodoro Timer -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <app-pomodoro-timer />
      </div>

      <!-- AI Sidekick -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-slate-900">AI Sidekick</h3>
            <p class="text-xs text-slate-500">Your intelligent study assistant</p>
          </div>
        </div>
        <button class="w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">
          Ask me anything
        </button>
      </div>

      <!-- Weekly Progress -->
      <div class="rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 p-6 text-white shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold">Weekly Progress</h3>
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
          </svg>
        </div>

        <!-- XP Goal -->
        <div class="mb-4">
          <div class="flex items-center justify-between text-sm mb-2">
            <span>XP Goal</span>
            <span class="font-semibold">450 / 600</span>
          </div>
          <div class="h-2 bg-white/20 rounded-full overflow-hidden">
            <div class="h-full bg-white rounded-full" style="width: 75%;"></div>
          </div>
        </div>

        <!-- Badges -->
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span class="text-sm">3 badges earned this week</span>
        </div>

        <!-- View All -->
        <button class="w-full flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20 transition-colors text-sm font-medium">
          <span>View All Achievements</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </aside>
  `
})
export class DashboardRightSidebarComponent {
  progress = () => 0.75; // 75% progress
}
