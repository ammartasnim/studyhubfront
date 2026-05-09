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
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '60m', seconds: 60 * 60 },
];

const SYNC_INTERVAL_TICKS = 30;

@Component({
  selector: 'app-focus-timer',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatTimerPipe],
  template: `
<div class="w-full max-w-7xl mx-auto p-4 md:p-10 antialiased text-slate-900">
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

    <!-- MAIN TIMER CARD -->
    <section class="bg-white border border-slate-200/60 rounded-[40px] p-8 md:p-12 shadow-xl shadow-slate-200/40 min-h-[640px] flex flex-col relative overflow-hidden">
      <div class="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none"></div>

      <header class="flex items-start justify-between relative z-10">
        <div>
          <p class="text-[11px] font-black tracking-[0.25em] uppercase text-indigo-500 mb-1">Focus Mode</p>
          <h2 class="text-3xl font-extrabold tracking-tight text-slate-900">Deep Work</h2>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
          @if (phase === 'running') {
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          }
          <span class="text-[11px] font-bold tracking-wider uppercase text-slate-500">{{ phaseLabel }}</span>
        </div>
      </header>

      <!-- SETUP PHASE -->
      @if (phase === 'setup') {
        <div class="flex flex-col gap-10 mt-12 flex-1 relative z-10">
          <div class="space-y-4">
            <label class="text-xs font-bold tracking-wide text-slate-400 uppercase ml-1">Current Objective</label>
            <input
              [(ngModel)]="sessionTitle"
              placeholder="What are you tackling?"
              class="w-full bg-slate-50/50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white rounded-2xl px-6 py-5 text-lg font-medium text-slate-800 outline-none transition-all placeholder:text-slate-300 shadow-sm"
            />
          </div>

          <div class="space-y-4">
            <label class="text-xs font-bold tracking-wide text-slate-400 uppercase ml-1">Select Duration</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              @for (preset of presets; track preset.seconds) {
                <button type="button" (click)="selectPreset(preset.seconds)"
                  class="group py-4 rounded-2xl border-2 font-bold text-sm transition-all"
                  [ngClass]="(!customMode && selectedSeconds === preset.seconds)
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-100 hover:text-indigo-600'">
                  {{ preset.label }}
                </button>
              }
              <button type="button" (click)="toggleCustom()"
                class="py-4 rounded-2xl border-2 font-bold text-xs uppercase tracking-tight transition-all"
                [ngClass]="customMode
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-100 hover:text-indigo-600'">
                Custom
              </button>
            </div>

            @if (customMode) {
              <div class="grid grid-cols-2 gap-4 mt-4">
                <div class="relative">
                  <input type="number" [(ngModel)]="customHours" min="0" max="8"
                    class="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-12 font-bold text-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">hr</span>
                </div>
                <div class="relative">
                  <input type="number" [(ngModel)]="customMinutes" min="0" max="59"
                    class="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-12 font-bold text-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">min</span>
                </div>
              </div>
            }
          </div>

          <button type="button" (click)="start()"
            [disabled]="!sessionTitle.trim() || effectiveSeconds < 60 || isLoading"
            class="mt-auto w-full bg-slate-900 py-5 rounded-2xl text-white font-bold text-lg shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-20 disabled:grayscale disabled:pointer-events-none transition-all">
            {{ isLoading ? 'Starting...' : 'Start Focused Session' }}
          </button>
        </div>
      }

      <!-- RUNNING / PAUSED PHASE -->
      @if (phase === 'running' || phase === 'paused') {
        <div class="flex flex-col items-center justify-center flex-1 gap-12 mt-8 relative z-10">
          <div class="relative w-72 h-72 md:w-80 md:h-80">
            <svg class="absolute inset-0 -rotate-90 w-full h-full drop-shadow-sm" viewBox="0 0 220 220">
              <circle class="fill-none stroke-slate-100 stroke-[5]" cx="110" cy="110" r="100"/>
              <circle
                class="fill-none stroke-indigo-600 stroke-[5] transition-[stroke-dashoffset] duration-1000 ease-linear"
                [class.opacity-40]="phase === 'paused'"
                stroke-linecap="round"
                cx="110" cy="110" r="100"
                [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="dashOffset"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <div class="text-6xl font-black text-slate-900 tracking-tighter tabular-nums">{{ remainingFormatted }}</div>
              <div class="text-[11px] font-black tracking-[0.3em] uppercase mt-3 transition-colors"
                   [ngClass]="phase === 'running' ? 'text-indigo-600' : 'text-slate-400'">
                {{ phase === 'running' ? 'Active' : 'On Hold' }}
              </div>
            </div>
          </div>

          <div class="text-center space-y-2">
            <h3 class="text-2xl font-bold text-slate-800">{{ sessionTitle }}</h3>
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Goal: {{ formatSeconds(totalSeconds) }}</span>
            </div>
          </div>

          <div class="flex gap-4 w-full max-w-md">
            @if (phase === 'running') {
              <button (click)="pause()"
                class="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 active:scale-95 transition-all">
                Pause
              </button>
            } @else {
              <button (click)="resume()"
                class="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                Resume
              </button>
            }
            <button (click)="stopAndSave()"
              class="flex-1 bg-rose-50 border-2 border-rose-100 text-rose-600 py-4 rounded-2xl font-bold hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95 transition-all">
              End Session
            </button>
          </div>

          <button (click)="cancelAndDiscard()"
            class="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors bg-transparent border-none cursor-pointer">
            Cancel & discard
          </button>
        </div>
      }

      <!-- DONE PHASE -->
      @if (phase === 'done') {
        <div class="flex flex-col items-center justify-center flex-1 text-center relative z-10">
          <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-6">✓</div>
          <h3 class="text-3xl font-black text-slate-900 mb-2">Well Done!</h3>
          <p class="text-slate-500 max-w-xs mx-auto mb-8">You've successfully completed your focus block. Take a moment to recharge.</p>

          <div class="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 w-full max-w-sm">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Session Summary</p>
            <p class="font-bold text-slate-700 text-lg">{{ savedMessage }}</p>
          </div>

          <button (click)="resetToSetup()"
            class="w-full max-w-sm bg-slate-900 py-5 rounded-2xl text-white font-bold hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all">
            Start New Session
          </button>
        </div>
      }
    </section>

    <!-- SIDEBAR / HISTORY -->
    <aside class="bg-slate-50/50 border border-slate-200/50 rounded-[40px] p-8 flex flex-col lg:sticky lg:top-10" style="max-height: 700px;">
      <div class="flex items-center justify-between mb-8">
        <h3 class="text-xs font-black tracking-[0.2em] uppercase text-slate-400">Activity History</h3>
        <span class="bg-white border border-slate-200 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
          {{ sessionHistory.length }} Total
        </span>
      </div>

      @if (isLoadingHistory()) {
        <div class="flex-1 flex items-center justify-center text-slate-300">
          <p class="text-[11px] font-bold tracking-widest uppercase">Loading...</p>
        </div>
      } @else if (sessionHistory.length === 0) {
        <div class="flex-1 flex flex-col items-center justify-center text-slate-300">
          <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 italic text-2xl font-serif">i</div>
          <p class="text-[11px] font-bold tracking-widest uppercase">No history yet</p>
        </div>
      } @else {
        <div class="flex flex-col gap-3 flex-1 overflow-y-auto pr-2">
          @for (session of visibleHistory; track $index) {
            <div class="bg-white border border-slate-100 p-5 rounded-3xl flex items-center justify-between gap-4 hover:border-indigo-200 hover:shadow-md transition-all group cursor-default">
              <div class="flex items-center gap-4 overflow-hidden">
                <div class="h-10 w-10 shrink-0 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <span class="text-xs font-bold">#{{ $index + 1 }}</span>
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span class="text-sm font-bold text-slate-700 truncate tracking-tight">{{ session.title }}</span>
                  <span class="text-[10px] font-medium text-slate-400 uppercase">
                    {{ session.createdAt ? (session.createdAt | date:'shortTime') : 'Focus Session' }}
                  </span>
                </div>
              </div>
              <span class="font-mono text-sm font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-lg shrink-0">
                {{ session.timer | formatTimer }}
              </span>
            </div>
          }
        </div>

        @if (sessionHistory.length > 5) {
          <button (click)="showAllHistory = !showAllHistory"
            class="mt-6 pt-6 border-t border-slate-200/60 w-full text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">
            {{ showAllHistory ? 'Show less' : 'Show all ' + sessionHistory.length }}
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

  // Timer state
  phase: Phase = 'setup';
  sessionTitle = '';
  selectedSeconds = 25 * 60;
  remainingSeconds = 0;
  totalSeconds = 0;
  sessionHistory: SessionHistoryItem[] = [];
  showAllHistory = false;
  savedMessage = '';
  isLoading = false;

  // Custom duration state
  customMode = false;
  customHours: number | null = 0;
  customMinutes: number | null = 25;

  // Session tracking
  private activeSessionId: number | null = null;
  private tickCount = 0;
  private timerSubscription: Subscription | null = null;

  readonly presets = PRESET_DURATIONS;
  readonly circumference = 2 * Math.PI * 100; // matches r="100" in SVG

  get phaseLabel(): string {
    return { setup: 'Ready', running: 'Active', paused: 'Paused', done: 'Done' }[this.phase];
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

  // ── API-WIRED ACTIONS ─────────────────────────────────────

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

  // ── PRIVATE ───────────────────────────────────────────────

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

      // Background sync every 30s to protect against crashes
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