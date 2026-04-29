import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatTimerPipe } from '../../pipes/format-timer.pipe';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { FocusSessionFacadeService } from '../../api/facades';
import { UserContextService } from '../../user-context.service';

type Phase = 'setup' | 'running' | 'paused' | 'done';

interface SessionHistoryItem {
  title: string;
  timer: string;
  userId?: number;
  createdAt?: Date;
}

const PRESET_DURATIONS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '60 min', seconds: 60 * 60 },
  { label: '90 min', seconds: 90 * 60 },
];

// How often (in ticks) to sync remaining time to the DB while running.
// 30 means every 30 seconds. This prevents data loss if the tab crashes.
const SYNC_INTERVAL_TICKS = 30;

@Component({
  selector: 'app-dashboard-right-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatTimerPipe],
  styles: [`
    .ring-progress {
      stroke: #3b82f6;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear;
    }
    .ring-progress.paused { stroke: #f59e0b; }
  `],
  template: `
  <div class="min-h-screen bg-purple-50 flex items-start justify-center px-4 py-10">
  <div class="w-full max-w-sm">

    <div class="flex items-center gap-2.5 mb-8">
      <div class="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="white" stroke-width="1.5"/>
          <path d="M8 5v3.5l2 1.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <span class="text-sm font-semibold text-purple-900 tracking-wide">Focus timer</span>
    </div>

    @if (phase === 'setup') {
      <div class="bg-white rounded-2xl border border-purple-100 p-6 flex flex-col gap-5">
        <div>
          <label class="block text-xs font-medium text-purple-400 uppercase tracking-widest mb-2">Session title</label>
          <input [(ngModel)]="sessionTitle" placeholder="What are you working on?"
            class="w-full bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"/>
        </div>
        <div>
          <label class="block text-xs font-medium text-purple-400 uppercase tracking-widest mb-2">Duration</label>
          <div class="grid grid-cols-4 gap-2">
            @for (preset of presets; track preset.seconds) {
              <button (click)="selectPreset(preset.seconds)"
                class="py-2.5 text-xs font-semibold rounded-xl border transition-all active:scale-95"
                [class]="selectedSeconds === preset.seconds
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-purple-50 text-purple-500 border-purple-100 hover:border-purple-300 hover:bg-purple-100'">
                {{ preset.label }}
              </button>
            }
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-purple-400 uppercase tracking-widest mb-2">
            Custom <span class="normal-case text-purple-300">(minutes)</span>
          </label>
          <input type="number" [(ngModel)]="customMinutes" (ngModelChange)="onCustomMinutesChange($event)"
            min="1" max="480" placeholder="e.g. 35"
            class="w-full bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"/>
        </div>
        <div class="flex items-center justify-between px-4 py-3 bg-purple-50 rounded-xl border border-purple-100">
          <span class="text-xs text-purple-400">Selected duration</span>
          <span class="text-sm font-semibold text-purple-700 font-mono">
            {{ selectedSeconds >= 3600
              ? (selectedSeconds / 3600 | number:'1.0-0') + 'h ' + ((selectedSeconds % 3600) / 60 | number:'1.0-0') + 'm'
              : (selectedSeconds / 60 | number:'1.0-0') + ' min' }}
          </span>
        </div>
        <button (click)="start()"
          [disabled]="!sessionTitle.trim() || selectedSeconds <= 0 || isLoading"
          class="w-full py-3.5 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-600">
          {{ isLoading ? 'Starting...' : 'Start session' }}
        </button>
      </div>
    }

    @if (phase === 'running' || phase === 'paused') {
      <div class="flex flex-col items-center gap-6">
        <div class="w-full bg-white rounded-2xl border border-purple-100 p-8 flex flex-col items-center gap-6">
          <div class="relative w-56 h-56">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="62" fill="none" stroke-width="7" class="stroke-purple-100"/>
              <circle cx="70" cy="70" r="62" fill="none" stroke-width="7" stroke-linecap="round"
                [class]="phase === 'paused' ? 'stroke-amber-400' : 'stroke-purple-500'"
                style="transition: stroke-dashoffset 1s linear, stroke 0.3s ease;"
                [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="dashOffset"/>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
              <div class="flex items-center gap-1.5 mb-2">
                <div class="w-1.5 h-1.5 rounded-full transition-colors"
                  [class]="phase === 'running' ? 'bg-purple-500 animate-pulse' : 'bg-amber-400'"></div>
                <span class="text-xs font-medium tracking-wide"
                  [class]="phase === 'running' ? 'text-purple-400' : 'text-amber-400'">
                  {{ phase === 'running' ? 'Focusing' : 'Paused' }}
                </span>
              </div>
              <span class="text-5xl font-bold tabular-nums tracking-tight text-purple-900 font-mono leading-none">
                {{ remainingFormatted }}
              </span>
              <span class="mt-2 text-xs text-purple-300">
                {{ ((remainingSeconds / totalSeconds) * 100 | number:'1.0-0') }}% remaining
              </span>
            </div>
          </div>
          <div class="w-full px-4 py-2.5 bg-purple-50 rounded-xl border border-purple-100">
            <p class="text-xs text-purple-400 mb-0.5">Working on</p>
            <p class="text-sm font-medium text-purple-800 truncate">{{ sessionTitle }}</p>
          </div>
          <div class="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-1000 ease-linear"
              [class]="phase === 'paused' ? 'bg-amber-400' : 'bg-purple-500'"
              [style.width.%]="(1 - remainingSeconds / totalSeconds) * 100">
            </div>
          </div>
        </div>

        <div class="flex gap-2.5 w-full">
          @if (phase === 'running') {
            <button (click)="pause()"
              class="flex-1 py-3 text-sm font-semibold rounded-xl border transition-all active:scale-95 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100">
              Pause
            </button>
          }
          @if (phase === 'paused') {
            <button (click)="resume()"
              class="flex-1 py-3 text-sm font-semibold rounded-xl border transition-all active:scale-95 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100">
              Resume
            </button>
          }
          <button (click)="stopAndSave()"
            class="flex-1 py-3 text-sm font-semibold rounded-xl border transition-all active:scale-95 bg-white text-red-500 border-red-200 hover:bg-red-50">
            Stop & save
          </button>
        </div>
        <button (click)="cancelAndDiscard()"
          class="text-xs text-purple-300 hover:text-purple-500 underline underline-offset-2 transition-colors bg-transparent border-none cursor-pointer">
          Cancel & discard
        </button>
      </div>
    }

    @if (phase === 'done') {
      <div class="bg-white rounded-2xl border border-purple-100 p-8 flex flex-col items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l5 5L19 7" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="text-center">
          <p class="text-base font-semibold text-purple-900">Session complete</p>
          <p class="text-sm text-purple-400 mt-1">{{ savedMessage }}</p>
        </div>
        <div class="w-full h-px bg-purple-50 my-1"></div>
        <button (click)="resetToSetup()"
          class="w-full py-3 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] bg-purple-600 text-white hover:bg-purple-700">
          Start another session
        </button>
      </div>
    }

    @if (sessionHistory.length > 0) {
      <div class="mt-6">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-medium text-purple-400 uppercase tracking-widest">Recent sessions</p>
          <span class="text-xs text-purple-300">{{ sessionHistory.length }} total</span>
        </div>
        <div class="flex flex-col gap-2">
          @for (session of visibleHistory; track $index) {
            <div class="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-purple-100">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-1.5 h-1.5 rounded-full bg-purple-300 shrink-0"></div>
                <span class="text-sm font-medium text-purple-800 truncate">{{ session.title }}</span>
              </div>
              <div class="flex items-center gap-3 shrink-0 ml-3">
                <span class="text-xs font-mono font-medium text-purple-500">{{ session.timer | formatTimer }}</span>
                <span class="text-xs text-purple-300">{{ session.createdAt ? (session.createdAt | date:'shortTime') : '—' }}</span>
              </div>
            </div>
          }
        </div>
        @if (sessionHistory.length > 5) {
          <button (click)="showAllHistory = !showAllHistory"
            class="mt-3 w-full py-2.5 text-xs font-medium text-purple-500 bg-white rounded-xl border border-purple-100 hover:bg-purple-50 transition-colors cursor-pointer">
            {{ showAllHistory ? 'Show less' : 'Show all ' + sessionHistory.length + ' sessions' }}
          </button>
        }
      </div>
    }

  </div>
</div>`
})
export class FocusTimerComponent implements OnInit, OnDestroy {
  phase: Phase = 'setup';
  sessionTitle = '';
  selectedSeconds = 25 * 60;
  customMinutes: number | undefined = undefined;
  remainingSeconds = 0;
  totalSeconds = 0;
  sessionHistory: SessionHistoryItem[] = [];
  showAllHistory = false;
  savedMessage = '';
  isLoading = false;

  // Stores the DB id of the active session so we can call pause/complete on it
  private activeSessionId: number | null = null;
  private tickCount = 0;
  private timerSubscription: Subscription | null = null;

  readonly presets = PRESET_DURATIONS;
  readonly circumference = 2 * Math.PI * 62; // matches r="62" in the SVG

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly focusSessionFacade = inject(FocusSessionFacadeService);
  private readonly userContext = inject(UserContextService);

  get dashOffset(): number {
    if (this.totalSeconds === 0) return 0;
    return this.circumference * (1 - this.remainingSeconds / this.totalSeconds);
  }

  get remainingFormatted(): string {
    const h = Math.floor(this.remainingSeconds / 3600);
    const m = Math.floor((this.remainingSeconds % 3600) / 60);
    const s = this.remainingSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  get visibleHistory(): SessionHistoryItem[] {
    return this.showAllHistory ? this.sessionHistory : this.sessionHistory.slice(0, 5);
  }

  ngOnInit(): void {
    this.restoreActiveSession();
    this.loadSessionHistory();
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
  }

  selectPreset(seconds: number): void {
    this.selectedSeconds = seconds;
    this.customMinutes = undefined;
  }

  onCustomMinutesChange(minutes: number | undefined): void {
    if (minutes && minutes > 0) {
      this.selectedSeconds = minutes * 60;
    }
  }

  // ── LIFECYCLE METHODS ────────────────────────────────────────

  start(): void {
    if (!this.sessionTitle.trim() || this.selectedSeconds <= 0) return;
    this.isLoading = true;

    this.focusSessionFacade.start({
      title: this.sessionTitle,
      timer: this.remainingFormatted,
      remainingSeconds: this.selectedSeconds
    }).subscribe({
      next: (session) => {
        this.activeSessionId = session.id;
        this.totalSeconds = this.selectedSeconds;
        this.remainingSeconds = this.selectedSeconds;
        this.phase = 'running';
        this.isLoading = false;
        this.tick();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to start session:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  pause(): void {
    if (!this.activeSessionId) return;
    this.timerSubscription?.unsubscribe();
    this.phase = 'paused';

    this.focusSessionFacade.pause(this.activeSessionId, this.remainingSeconds).subscribe({
      error: (err) => console.error('Failed to pause session:', err)
    });
  }

  resume(): void {
    if (!this.activeSessionId) return;

    this.focusSessionFacade.resume(this.activeSessionId, this.remainingSeconds).subscribe({
      next: () => {
        this.phase = 'running';
        this.tick();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to resume session:', err)
    });
  }

  stopAndSave(): void {
    if (!this.activeSessionId) return;
    this.timerSubscription?.unsubscribe();

    const elapsed = this.totalSeconds - this.remainingSeconds;
    const finalTimer = new Date(elapsed * 1000).toISOString().substring(11, 19);

    this.focusSessionFacade.complete(this.activeSessionId, finalTimer).subscribe({
      next: () => {
        this.savedMessage = `"${this.sessionTitle}" — ${finalTimer}`;
        this.phase = 'done';
        this.activeSessionId = null;
        this.loadSessionHistory();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to complete session:', err)
    });
  }

  cancelAndDiscard(): void {
    // User discards without saving — complete it on the backend so it
    // doesn't come back as "active" on next load, then reset the UI
    if (this.activeSessionId) {
      this.timerSubscription?.unsubscribe();
      this.focusSessionFacade.complete(this.activeSessionId, '00:00:00').subscribe({
        error: (err) => console.error('Failed to discard session:', err)
      });
    }
    this.resetToSetup();
  }

  resetToSetup(): void {
    this.timerSubscription?.unsubscribe();
    this.phase = 'setup';
    this.remainingSeconds = 0;
    this.activeSessionId = null;
    this.tickCount = 0;
  }

  loadSessionHistory(): void {
    const userId = this.userContext.user()?.id;
    if (!userId) { this.sessionHistory = []; return; }

    this.focusSessionFacade.getByUser(userId).subscribe({
      next: (sessions) => {
        this.sessionHistory = sessions.map((s) => this.mapToHistoryItem(s));
        this.cdr.detectChanges();
      },
      error: () => { this.sessionHistory = []; this.cdr.detectChanges(); }
    });
  }

  // ── PRIVATE HELPERS ──────────────────────────────────────────

  // Called on ngOnInit — restores state if the user refreshed mid-session
  private restoreActiveSession(): void {
    this.focusSessionFacade.getActive().subscribe({
      next: (session) => {
        if (!session) return; // 204 No Content — nothing to restore

        this.activeSessionId = session.id;
        this.sessionTitle = session.title;
        this.remainingSeconds = session.remainingSeconds;

        // totalSeconds isn't stored in DB — we reconstruct it from the
        // nearest preset or fall back to remaining (slightly inaccurate
        // for the ring but functionally fine)
        const matchedPreset = PRESET_DURATIONS.find(p =>
          p.seconds >= session.remainingSeconds
        );
        this.totalSeconds = matchedPreset?.seconds ?? session.remainingSeconds;

        this.phase = session.status === 'PAUSED' ? 'paused' : 'running';
        if (this.phase === 'running') this.tick();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Could not restore session:', err)
    });
  }

  private tick(): void {
    this.tickCount = 0;
    this.timerSubscription = interval(1000).subscribe(() => {
      this.remainingSeconds--;
      this.tickCount++;
      this.cdr.detectChanges();

      // Auto-complete when timer reaches zero
      if (this.remainingSeconds <= 0) {
        this.timerSubscription?.unsubscribe();
        if (this.activeSessionId) {
          const finalTimer = new Date(this.totalSeconds * 1000).toISOString().substring(11, 19);
          this.focusSessionFacade.complete(this.activeSessionId, finalTimer).subscribe({
            next: () => {
              this.savedMessage = `"${this.sessionTitle}" — ${finalTimer}`;
              this.phase = 'done';
              this.activeSessionId = null;
              this.loadSessionHistory();
              this.cdr.detectChanges();
            }
          });
        }
        return;
      }

      // Periodic sync: every SYNC_INTERVAL_TICKS seconds, push remaining
      // time to DB so a crash doesn't lose all progress
      if (this.tickCount % SYNC_INTERVAL_TICKS === 0 && this.activeSessionId) {
        this.focusSessionFacade.pause(this.activeSessionId, this.remainingSeconds).subscribe({
          // Immediately re-set to ACTIVE after the sync pause
          next: () => {
            if (this.activeSessionId) {
              this.focusSessionFacade.resume(this.activeSessionId, this.remainingSeconds).subscribe();
            }
          }
        });
      }
    });
  }

  private mapToHistoryItem(s: any): SessionHistoryItem {
    return {
      title: s.title ?? '',
      timer: s.displayDuration ?? '00:00:00',
      userId: s.userId ?? undefined,
      createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
    };
  }
}