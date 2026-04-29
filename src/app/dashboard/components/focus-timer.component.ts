import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { FocusSessionFacadeService } from '../../api/facades/focus-session.facade';
import { UserContextService } from '../../user-context.service';
import { FormatTimerPipe } from '../../pomodoro-timer/format-timer.pipe';
import { PaginationComponent } from '../../shared/pagination/pagination.component';
import { PaginationService } from '../../shared/pagination/pagination.service';

type Phase = 'setup' | 'running' | 'paused' | 'done';

interface SessionHistoryItem {
  title: string;
  timer: string;
  createdAt?: Date;
}

const PRESETS = [
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '60m', seconds: 60 * 60 },
];

@Component({
  selector: 'app-focus-timer',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatTimerPipe, PaginationComponent],
  template: `
    <div class="w-[100%] max-w-full p-4 md:p-8">
      <div class="grid grid-cols-1 lg:grid-cols-[1.85fr_0.65fr] gap-6 min-h-[600px]">
        
        <section class="bg-white border border-purple-100 rounded-[32px] p-8 flex flex-col shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[10px] font-bold tracking-[0.2em] uppercase text-purple-600">Focus Timer</p>
              <h2 class="text-2xl font-bold text-slate-900 mt-2">Deep work session</h2>
            </div>
            <span class="text-[11px] font-bold tracking-wider uppercase text-purple-400 bg-purple-50 border border-purple-100 rounded-full px-4 py-1.5">
              {{ phaseLabel }}
            </span>
          </div>

          @if (phase === 'setup') {
            <div class="flex flex-col gap-8 mt-10 flex-1">
              <div class="flex flex-col">
                <label class="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400 mb-3">What are you working on?</label>
                <input
                  [(ngModel)]="sessionTitle"
                  placeholder="e.g. Write design doc, fix bug #423…"
                  class="w-full bg-white border border-purple-100 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-purple-500 transition-colors placeholder:text-slate-300"
                />
              </div>

              <div class="flex flex-col">
                <label class="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400 mb-3">Duration</label>
                <div class="grid grid-cols-4 gap-2">
                  @for (preset of presets; track preset.seconds) {
                    <button
                      type="button"
                      (click)="selectPreset(preset.seconds)"
                      class="py-3 rounded-xl border font-semibold text-sm transition-all"
                      [ngClass]="(!customMode && selectedSeconds === preset.seconds) 
                        ? 'bg-purple-100 border-purple-500 text-purple-700' 
                        : 'bg-slate-50 border-purple-50 text-purple-400 hover:border-purple-200'"
                    >{{ preset.label }}</button>
                  }
                  <button
                    type="button"
                    (click)="toggleCustom()"
                    class="py-3 rounded-xl border font-semibold text-[11px] uppercase tracking-tighter transition-all"
                    [ngClass]="customMode 
                      ? 'bg-purple-100 border-purple-500 text-purple-700' 
                      : 'bg-slate-50 border-purple-50 text-purple-400 hover:border-purple-200'"
                  >Custom</button>
                </div>

                @if (customMode) {
                  <div class="grid grid-cols-2 gap-3 mt-3">
                    <div class="relative">
                      <input type="number" [(ngModel)]="customHours" class="w-full border border-purple-200 rounded-xl p-3 pr-10 font-mono focus:border-purple-500 outline-none" placeholder="0">
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">hr</span>
                    </div>
                    <div class="relative">
                      <input type="number" [(ngModel)]="customMinutes" class="w-full border border-purple-200 rounded-xl p-3 pr-10 font-mono focus:border-purple-500 outline-none" placeholder="25">
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">min</span>
                    </div>
                  </div>
                }
              </div>

              <button
                type="button"
                (click)="startSession()"
                [disabled]="!sessionTitle.trim() || effectiveSeconds < 60"
                class="mt-auto w-full bg-gradient-to-br from-purple-600 to-fuchsia-500 py-4 rounded-2xl text-white font-bold text-base shadow-lg shadow-purple-200 hover:opacity-90 disabled:opacity-30 disabled:shadow-none transition-all"
              >
                Start session →
              </button>
            </div>
          }

          @if (phase === 'running' || phase === 'paused') {
            <div class="flex flex-col items-center justify-center flex-1 gap-10 mt-6">
              <div class="relative w-64 h-64">
                <svg class="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 220 220">
                  <circle class="fill-none stroke-slate-50 stroke-[6]" cx="110" cy="110" r="100"/>
                  <circle
                    class="fill-none stroke-purple-500 stroke-[6] transition-[stroke-dashoffset] duration-1000 ease-linear"
                    [class.stroke-slate-300]="phase === 'paused'"
                    stroke-linecap="round"
                    cx="110" cy="110" r="100"
                    [attr.stroke-dasharray]="circumference"
                    [attr.stroke-dashoffset]="dashOffset"
                  />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <div class="font-mono text-5xl font-light text-slate-900 tracking-tighter">{{ remainingFormatted }}</div>
                  <div class="text-[10px] font-bold tracking-[0.25em] uppercase mt-2" 
                       [ngClass]="phase === 'running' ? 'text-purple-600' : 'text-slate-400'">
                    {{ phase === 'running' ? 'Focusing' : 'Paused' }}
                  </div>
                </div>
              </div>

              <div class="text-center">
                <p class="text-lg font-bold text-slate-800">{{ sessionTitle }}</p>
                <p class="text-xs font-mono text-slate-400 mt-1">{{ formatSeconds(totalSeconds) }} planned</p>
              </div>

              <div class="flex gap-3 w-full">
                @if (phase === 'running') {
                  <button (click)="pauseSession()" class="flex-1 bg-purple-50 border border-purple-200 text-purple-700 py-4 rounded-2xl font-bold hover:bg-purple-500 hover:text-white transition-all">⏸ Pause</button>
                }
                @if (phase === 'paused') {
                  <button (click)="resumeSession()" class="flex-1 bg-purple-50 border border-purple-200 text-purple-700 py-4 rounded-2xl font-bold hover:bg-purple-500 hover:text-white transition-all">▶ Resume</button>
                }
                <button (click)="stopAndSave()" class="flex-1 border border-slate-200 text-slate-500 py-4 rounded-2xl font-bold hover:border-red-400 hover:text-red-500 hover:bg-red-50 transition-all">■ Stop & Save</button>
              </div>
            </div>
          }

          @if (phase === 'done') {
            <div class="flex flex-col items-center justify-center flex-1 mt-6 text-center">
              <div class="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-[24px] p-10 w-full">
                <p class="text-lg font-bold text-purple-700">✓ Session saved</p>
                <p class="text-sm text-purple-400 mt-1">Nice work — keep the momentum going.</p>
                <p class="mt-4 font-mono text-sm bg-white border border-purple-100 py-2 px-4 rounded-lg inline-block text-slate-700">
                  {{ savedMessage }}
                </p>
              </div>
              <button (click)="resetToSetup()" class="mt-8 w-full bg-gradient-to-br from-purple-600 to-fuchsia-500 py-4 rounded-2xl text-white font-bold transition-opacity hover:opacity-90">
                Start another session
              </button>
            </div>
          }
        </section>

        <aside class="bg-slate-50/50 border border-slate-100 rounded-[32px] p-8 flex flex-col">
          <div class="flex items-center justify-between mb-8">
            <p class="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">History</p>
            @if (paginationConfig().totalElements > 0) {
              <span class="bg-white border border-slate-200 text-slate-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {{ paginationConfig().totalElements }}
              </span>
            }
          </div>

          <!-- FIX: tie empty state to sessionHistory.length, not totalElements -->
          @if (sessionHistory.length === 0 && !isLoadingHistory()) {
            <div class="flex-1 flex flex-col items-center justify-center text-slate-300">
              <span class="text-4xl mb-2">◎</span>
              <span class="text-[10px] font-bold tracking-widest uppercase">No sessions</span>
            </div>
          } @else {
            <div class="flex flex-col gap-3 flex-1 overflow-y-auto">
              @for (session of sessionHistory; track $index) {
                <div class="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-purple-300 transition-colors group">
                  <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:scale-125 transition-transform"></div>
                    <span class="text-sm font-semibold text-slate-700 truncate">{{ session.title }}</span>
                  </div>
                  <span class="font-mono text-xs text-slate-400">{{ session.timer | formatTimer }}</span>
                </div>
              }
            </div>
          }

          <!-- Pagination Component -->
          @if (paginationConfig().totalElements > 0) {
            <div class="mt-6 pt-6 border-t border-slate-200">
              <app-pagination 
                [config]="paginationConfig()"
                [isLoading]="isLoadingHistory()"
                (pageChange)="onPageChange($event)"
                (pageSizeChange)="onPageSizeChange($event)">
              </app-pagination>
            </div>
          }
        </aside>

      </div>
    </div>
  `
})
export class FocusTimerComponent implements OnInit, OnDestroy {
  phase: Phase = 'setup';
  sessionTitle = '';
  selectedSeconds = 25 * 60;
  remainingSeconds = 0;
  totalSeconds = 0;
  sessionHistory: SessionHistoryItem[] = [];
  savedMessage = '';

  customMode = false;
  customHours: number | null = null;
  customMinutes: number | null = 25;

  readonly presets = PRESETS;
  readonly circumference = 2 * Math.PI * 100;

  readonly isLoadingHistory = signal(false);
  readonly paginationConfig = signal({
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
    hasNext: false,
    hasPrevious: false,
  });

  private timerSubscription: Subscription | null = null;
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly focusSessionFacade = inject(FocusSessionFacadeService);
  private readonly userContext = inject(UserContextService);
  private readonly paginationService = inject(PaginationService);

  get phaseLabel(): string {
    return { setup: 'Ready', running: 'Active', paused: 'Paused', done: 'Done' }[this.phase];
  }

  get remainingFormatted(): string {
    const h = Math.floor(this.remainingSeconds / 3600);
    const m = Math.floor((this.remainingSeconds % 3600) / 60);
    const s = this.remainingSeconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  get dashOffset(): number {
    const progress = this.totalSeconds > 0 ? this.remainingSeconds / this.totalSeconds : 1;
    return this.circumference * (1 - progress);
  }

  get effectiveSeconds(): number {
    if (!this.customMode) return this.selectedSeconds;
    const h = Number(this.customHours) || 0;
    const m = Number(this.customMinutes) || 0;
    return h * 3600 + m * 60;
  }

  ngOnInit(): void {
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
    if (this.customMode) {
      this.customHours = 0;
      this.customMinutes = 25;
    }
  }

  formatSeconds(s: number): string {
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  }

  startSession(): void {
    this.totalSeconds = this.effectiveSeconds;
    this.remainingSeconds = this.totalSeconds;
    this.phase = 'running';
    this.tick();
  }

  pauseSession(): void {
    this.phase = 'paused';
    this.timerSubscription?.unsubscribe();
  }

  resumeSession(): void {
    this.phase = 'running';
    this.tick();
  }

  stopAndSave(): void {
    this.timerSubscription?.unsubscribe();
    this.save(this.totalSeconds - this.remainingSeconds);
  }

  resetToSetup(): void {
    this.timerSubscription?.unsubscribe();
    this.phase = 'setup';
    this.remainingSeconds = 0;
  }

  private loadSessionHistory(): void {
    const userId = this.userContext.user()?.id;
    if (!userId) {
      console.warn('No userId available for loading session history');
      return;
    }

    this.isLoadingHistory.set(true);

    // Using facade service - cleaner API
    this.focusSessionFacade.getByUser(userId).subscribe({
      next: (sessions) => {
        this.sessionHistory = sessions.map(session => ({
          title: session.title ?? '',
          timer: session.timer ?? '00:00:00' // Use timer field
        }));

        // Synthesise pagination config
        this.paginationConfig.set({
          currentPage: 0,
          pageSize: sessions.length,
          totalPages: 1,
          totalElements: sessions.length,
          hasNext: false,
          hasPrevious: false,
        });

        this.isLoadingHistory.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load session history:', err);
        this.sessionHistory = [];
        this.isLoadingHistory.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(page: number): void {
    this.paginationService.setCurrentPage(page);
    this.loadSessionHistory();
  }

  onPageSizeChange(size: number): void {
    this.paginationService.setPageSize(size);
    this.loadSessionHistory();
  }

  private tick(): void {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = interval(1000).subscribe(() => {
      this.remainingSeconds--;
      this.cdr.detectChanges();
      if (this.remainingSeconds <= 0) {
        this.timerSubscription?.unsubscribe();
        this.save(this.totalSeconds);
      }
    });
  }

  private save(elapsedSeconds: number): void {
    const timer = new Date(elapsedSeconds * 1000).toISOString().substring(11, 19);
    const userId = this.userContext.user()?.id;

    const sessionData = {
      duration: elapsedSeconds / 60, // Convert to minutes
      title: this.sessionTitle || 'Focus Session'
    };

    this.savedMessage = `${this.sessionTitle} · ${timer}`;
    this.phase = 'done';

    if (userId) {
      // Using facade service
      this.focusSessionFacade.create(sessionData).subscribe({
        next: () => this.loadSessionHistory(),
        error: () => this.addToLocalHistory(sessionData, timer),
      });
    } else {
      this.addToLocalHistory(sessionData, timer);
    }
  }

  private addToLocalHistory(sessionData: any, timer: string): void {
    this.sessionHistory = [
      { title: sessionData.title, timer: timer },
      ...this.sessionHistory,
    ];
    this.cdr.detectChanges();
  }
}