import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { FocusSessionFacadeService } from '../../../api/facades/focus-session.facade';
import { UserContextService } from '../../../services/user-context.service';
import { FormatTimerPipe } from '../../../core/pipes/format-timer.pipe';

type Phase = 'setup' | 'running' | 'paused' | 'done';

interface SessionHistoryItem {
  title: string;
  timer: string;
  createdAt?: Date;
}

const PRESET_DURATIONS = [
  { label: '25 min', seconds: 25 * 60 },
  { label: '45 min', seconds: 45 * 60 },
  { label: '60 min', seconds: 60 * 60 },
  { label: '90 min', seconds: 90 * 60 },
];

const SYNC_INTERVAL_TICKS = 30;

@Component({
  selector: 'app-focus-timer',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatTimerPipe],
  template: `
<div class="w-full max-w-7xl mx-auto p-4 md:p-10 antialiased text-purple-900">
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

    <!-- MAIN TIMER CARD -->
    <section class="bg-white border border-purple-100 rounded-2xl p-6 md:p-8 shadow-sm min-h-[640px] flex flex-col relative overflow-hidden">
      <div class="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-50/50 rounded-full blur-3xl pointer-events-none"></div>

      <header class="flex items-start justify-between relative z-10">
        <div>
          <p class="text-xs font-medium text-purple-400 uppercase tracking-widest mb-1">Focus Mode</p>
          <h2 class="text-xl font-semibold tracking-wide text-purple-900">Deep Work</h2>
        </div>
        <div class="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl">
          @if (phase === 'running') {
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-300 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          }
          <span class="text-xs font-medium tracking-wide"
            [ngClass]="phase === 'running' ? 'text-purple-400' : phase === 'paused' ? 'text-amber-400' : 'text-purple-300'">
            {{ phaseLabel }}
          </span>
        </div>
      </header>

      <!-- SETUP PHASE -->
      @if (phase === 'setup') {
        <div class="flex flex-col gap-8 mt-10 flex-1 relative z-10">
          <div class="space-y-3">
            <label class="block text-xs font-medium text-purple-400 uppercase tracking-widest mb-2">Session Title</label>
            <input
              [(ngModel)]="sessionTitle"
              placeholder="What are you working on?"
              class="w-full bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
            />
          </div>

          <div class="space-y-3">
            <label class="block text-xs font-medium text-purple-400 uppercase tracking-widest mb-2">Duration</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              @for (preset of presets; track preset.seconds) {
                <button type="button" (click)="selectPreset(preset.seconds)"
                  class="py-2.5 rounded-xl border font-semibold text-xs transition-all active:scale-95"
                  [ngClass]="(!customMode && selectedSeconds === preset.seconds)
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-purple-50 text-purple-500 border-purple-100 hover:border-purple-300 hover:bg-purple-100'">
                  {{ preset.label }}
                </button>
              }
              <button type="button" (click)="toggleCustom()"
                class="py-2.5 rounded-xl border font-semibold text-xs uppercase tracking-tight transition-all active:scale-95"
                [ngClass]="customMode
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-purple-50 text-purple-500 border-purple-100 hover:border-purple-300 hover:bg-purple-100'">
                Custom
              </button>
            </div>

            @if (customMode) {
              <div class="grid grid-cols-2 gap-3 mt-4">
                <div class="relative">
                  <input type="number" [(ngModel)]="customHours" min="0" max="8"
                    class="w-full bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 pr-12 text-sm text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all">
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-purple-400 uppercase">hr</span>
                </div>
                <div class="relative">
                  <input type="number" [(ngModel)]="customMinutes" min="0" max="59"
                    class="w-full bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 pr-12 text-sm text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all">
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-purple-400 uppercase">min</span>
                </div>
              </div>
            }
          </div>

          @if (effectiveSeconds > 0) {
            <div class="flex items-center justify-between px-4 py-3 bg-purple-50 rounded-xl border border-purple-100">
              <span class="text-xs text-purple-400">Selected duration</span>
              <span class="text-sm font-semibold text-purple-700 font-mono">
                {{ effectiveSeconds >= 3600
                  ? (effectiveSeconds / 3600 | number:'1.0-0') + 'h ' + ((effectiveSeconds % 3600) / 60 | number:'1.0-0') + 'm'
                  : (effectiveSeconds / 60 | number:'1.0-0') + ' min' }}
              </span>
            </div>
          }

          <button type="button" (click)="start()"
            [disabled]="!sessionTitle.trim() || effectiveSeconds < 60 || isLoading"
            class="mt-auto w-full py-3.5 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-600">
            {{ isLoading ? 'Starting...' : 'Start session' }}
          </button>
        </div>
      }

      <!-- RUNNING / PAUSED PHASE -->
      @if (phase === 'running' || phase === 'paused') {
        <div class="flex flex-col items-center justify-center flex-1 gap-10 mt-6 relative z-10">
          <div class="relative w-72 h-72 md:w-80 md:h-80">
            <svg class="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 220 220">
              <circle class="fill-none stroke-purple-100 stroke-[5]" cx="110" cy="110" r="100"/>
              <circle
                class="fill-none stroke-[5] transition-[stroke-dashoffset] duration-1000 ease-linear"
                [class]="phase === 'paused' ? 'stroke-amber-400' : 'stroke-purple-500'"
                stroke-linecap="round"
                cx="110" cy="110" r="100"
                [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="dashOffset"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <div class="flex items-center gap-1.5 mb-3">
                <div class="w-1.5 h-1.5 rounded-full transition-colors"
                  [class]="phase === 'running' ? 'bg-purple-500 animate-pulse' : 'bg-amber-400'"></div>
                <span class="text-xs font-medium tracking-wide"
                  [class]="phase === 'running' ? 'text-purple-400' : 'text-amber-400'">
                  {{ phase === 'running' ? 'Focusing' : 'Paused' }}
                </span>
              </div>
              <div class="text-5xl font-bold tabular-nums tracking-tight text-purple-900 font-mono leading-none">
                {{ remainingFormatted }}
              </div>
              <span class="mt-2 text-xs text-purple-300">
                {{ ((remainingSeconds / totalSeconds) * 100 | number:'1.0-0') }}% remaining
              </span>
            </div>
          </div>

          <div class="w-full px-4 py-2.5 bg-purple-50 rounded-xl border border-purple-100 max-w-sm">
            <p class="text-xs text-purple-400 mb-0.5">Working on</p>
            <p class="text-sm font-medium text-purple-800 truncate">{{ sessionTitle }}</p>
          </div>

          <div class="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden max-w-sm">
            <div class="h-full rounded-full transition-all duration-1000 ease-linear"
              [class]="phase === 'paused' ? 'bg-amber-400' : 'bg-purple-500'"
              [style.width.%]="(1 - remainingSeconds / totalSeconds) * 100">
            </div>
          </div>

          <div class="flex gap-2.5 w-full max-w-md">
            @if (phase === 'running') {
              <button (click)="pause()"
                class="flex-1 py-3 text-sm font-semibold rounded-xl border transition-all active:scale-95 bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100">
                Pause
              </button>
            } @else {
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

      <!-- DONE PHASE -->
      @if (phase === 'done') {
        <div class="flex flex-col items-center justify-center flex-1 text-center relative z-10">
          <div class="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l5 5L19 7" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="text-base font-semibold text-purple-900">Session complete</p>
          <p class="text-sm text-purple-400 mt-1 mb-8">{{ savedMessage }}</p>

          <div class="w-full h-px bg-purple-50 my-1"></div>

          <button (click)="resetToSetup()"
            class="w-full py-3 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] bg-purple-600 text-white hover:bg-purple-700 max-w-sm">
            Start another session
          </button>
        </div>
      }
    </section>

    <!-- SIDEBAR / HISTORY -->
    <aside class="bg-white border border-purple-100 rounded-2xl p-6 shadow-sm flex flex-col lg:sticky lg:top-10" style="max-height: 700px;">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xs font-medium text-purple-400 uppercase tracking-widest">Recent sessions</h3>
        <span class="text-xs text-purple-300">{{ sessionHistory.length }} total</span>
      </div>

      @if (isLoadingHistory()) {
        <div class="flex-1 flex items-center justify-center text-purple-200">
          <p class="text-xs font-medium tracking-widest uppercase">Loading...</p>
        </div>
      } @else if (sessionHistory.length === 0) {
        <div class="flex-1 flex flex-col items-center justify-center text-purple-200">
          <div class="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4 italic text-2xl font-serif">i</div>
          <p class="text-xs font-medium tracking-widest uppercase">No history yet</p>
        </div>
      } @else {
        <div class="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
          @for (session of visibleHistory; track $index) {
            <div class="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-purple-100">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-1.5 h-1.5 rounded-full bg-purple-300 shrink-0"></div>
                <span class="text-sm font-medium text-purple-800 truncate">{{ session.title }}</span>
              </div>
              <div class="flex items-center gap-3 shrink-0 ml-3">
                <span class="text-xs font-mono font-medium text-purple-500">{{ session.timer | formatTimer }}</span>
                <span class="text-xs text-purple-300">
                  {{ session.createdAt ? (session.createdAt | date:'shortTime') : '—' }}
                </span>
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
      }
    </aside>

  </div>
</div>
  `
})
export class FocusTimerComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly focusSessionFacade = inject(FocusSessionFacadeService);
  private readonly userContext = inject(UserContextService);

  readonly isLoadingHistory = signal(false);

  phase: Phase = 'setup';
  sessionTitle = '';
  selectedSeconds = 25 * 60;
  remainingSeconds = 0;
  totalSeconds = 0;
  sessionHistory: SessionHistoryItem[] = [];
  showAllHistory = false;
  savedMessage = '';
  isLoading = false;

  customMode = false;
  customHours: number | null = 0;
  customMinutes: number | null = 25;

  private activeSessionId: number | null = null;
  private tickCount = 0;
  private timerSubscription: Subscription | null = null;

  readonly presets = PRESET_DURATIONS;
  readonly circumference = 2 * Math.PI * 100;

  get phaseLabel(): string {
    return { setup: 'Ready', running: 'Focusing', paused: 'Paused', done: 'Done' }[this.phase];
  }

  get remainingFormatted(): string {
    const h = Math.floor(this.remainingSeconds / 3600);
    const m = Math.floor((this.remainingSeconds % 3600) / 60);
    const s = this.remainingSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  get dashOffset(): number {
    if (this.totalSeconds === 0) return 0;
    return this.circumference * (1 - this.remainingSeconds / this.totalSeconds);
  }

  get effectiveSeconds(): number {
    if (!this.customMode) return this.selectedSeconds;
    return ((Number(this.customHours) || 0) * 3600) + ((Number(this.customMinutes) || 0) * 60);
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
    this.customMode = false;
    this.selectedSeconds = seconds;
  }

  toggleCustom(): void {
    this.customMode = !this.customMode;
  }

  formatSeconds(s: number): string {
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  }

  start(): void {
    const seconds = this.effectiveSeconds;
    if (!this.sessionTitle.trim() || seconds < 60) return;
    this.isLoading = true;

    this.focusSessionFacade.start({
      title: this.sessionTitle,
      timer: this.remainingFormatted,
      remainingSeconds: seconds
    }).subscribe({
      next: (session) => {
        this.activeSessionId = session.id;
        this.totalSeconds = seconds;
        this.remainingSeconds = seconds;
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
    if (this.activeSessionId) {
      this.timerSubscription?.unsubscribe();
      this.focusSessionFacade.complete(this.activeSessionId, '00:00:00').subscribe({
        error: (err) => console.error('Failed to discard session:', err)
      });
    }
    this.resetToSetup();
  }

  pauseSession(): void {
    this.pause();
  }

  resetToSetup(): void {
    this.timerSubscription?.unsubscribe();
    this.phase = 'setup';
    this.remainingSeconds = 0;
    this.activeSessionId = null;
    this.tickCount = 0;
    this.sessionTitle = '';
  }

  loadSessionHistory(): void {
    const userId = this.userContext.user()?.id;
    if (!userId) { this.sessionHistory = []; return; }

    this.isLoadingHistory.set(true);
    this.focusSessionFacade.getByUser(userId).subscribe({
      next: (sessions) => {
        this.sessionHistory = sessions.map((s: any) => ({
          title: s.title ?? '',
          timer: s.displayDuration ?? s.timer ?? '00:00:00',
          createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
        }));
        this.isLoadingHistory.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.sessionHistory = [];
        this.isLoadingHistory.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  private restoreActiveSession(): void {
    this.focusSessionFacade.getActive().subscribe({
      next: (session) => {
        if (!session) return;

        this.activeSessionId = session.id;
        this.sessionTitle = session.title;
        this.remainingSeconds = session.remainingSeconds;

        const matchedPreset = PRESET_DURATIONS.find(p => p.seconds >= session.remainingSeconds);
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

      if (this.tickCount % SYNC_INTERVAL_TICKS === 0 && this.activeSessionId) {
        this.focusSessionFacade.pause(this.activeSessionId, this.remainingSeconds).subscribe({
          next: () => {
            if (this.activeSessionId) {
              this.focusSessionFacade.resume(this.activeSessionId, this.remainingSeconds).subscribe();
            }
          }
        });
      }
    });
  }
}
