import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { FocusSessionFacadeService } from '../../api/facades/focus-session.facade';
import { UserContextService } from '../../user-context.service';
import { FormatTimerPipe } from '../../pipes/format-timer.pipe';
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
   <div class="w-full max-w-7xl mx-auto p-4 md:p-10 antialiased text-slate-900">
  <div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
    
    <!-- MAIN TIMER CARD -->
    <section class="bg-white border border-slate-200/60 rounded-[40px] p-8 md:p-12 shadow-xl shadow-slate-200/40 min-h-[640px] flex flex-col relative overflow-hidden">
      <!-- Subtle Background Decor -->
      <div class="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl"></div>
      
      <header class="flex items-start justify-between relative z-10">
        <div>
          <p class="text-[11px] font-black tracking-[0.25em] uppercase text-indigo-500 mb-1">Focus Mode</p>
          <h2 class="text-3xl font-extrabold tracking-tight text-slate-900">Deep Work</h2>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
          <span class="relative flex h-2 w-2" *ngIf="phase === 'running'">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
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
                <button
                  type="button"
                  (click)="selectPreset(preset.seconds)"
                  class="group py-4 rounded-2xl border-2 font-bold text-sm transition-all"
                  [ngClass]="(!customMode && selectedSeconds === preset.seconds) 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                    : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-100 hover:text-indigo-600'"
                >
                  {{ preset.label }}
                </button>
              }
              <button
                type="button"
                (click)="toggleCustom()"
                class="py-4 rounded-2xl border-2 font-bold text-xs uppercase tracking-tight transition-all"
                [ngClass]="customMode 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-100 hover:text-indigo-600'"
              >
                Custom
              </button>
            </div>

            @if (customMode) {
              <div class="grid grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div class="relative">
                  <input type="number" [(ngModel)]="customHours" class="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-12 font-bold text-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">hr</span>
                </div>
                <div class="relative">
                  <input type="number" [(ngModel)]="customMinutes" class="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-12 font-bold text-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">min</span>
                </div>
              </div>
            }
          </div>

          <button
            type="button"
            (click)="startSession()"
            [disabled]="!sessionTitle.trim() || effectiveSeconds < 60"
            class="mt-auto w-full bg-slate-900 py-5 rounded-2xl text-white font-bold text-lg shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-20 disabled:grayscale disabled:pointer-events-none transition-all"
          >
            Start Focused Session
          </button>
        </div>
      }

      <!-- ACTIVE/PAUSED PHASE -->
      @if (phase === 'running' || phase === 'paused') {
        <div class="flex flex-col items-center justify-center flex-1 gap-12 mt-8 animate-in zoom-in-95 duration-500">
          <div class="relative w-72 h-72 md:w-80 md:h-80">
            <!-- Progress Ring -->
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
              <button (click)="pauseSession()" class="flex-1 bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 active:scale-95 transition-all">Pause</button>
            } @else {
              <button (click)="resumeSession()" class="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all">Resume</button>
            }
            <button (click)="stopAndSave()" class="flex-1 bg-rose-50 border-2 border-rose-100 text-rose-600 py-4 rounded-2xl font-bold hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95 transition-all">End Session</button>
          </div>
        </div>
      }

      <!-- DONE PHASE -->
      @if (phase === 'done') {
        <div class="flex flex-col items-center justify-center flex-1 text-center animate-in fade-in scale-95 duration-500">
          <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-6">✓</div>
          <h3 class="text-3xl font-black text-slate-900 mb-2">Well Done!</h3>
          <p class="text-slate-500 max-w-xs mx-auto mb-8">You've successfully completed your focus block. Take a moment to recharge.</p>
          
          <div class="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 w-full max-w-sm">
             <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Session Summary</p>
             <p class="font-bold text-slate-700 text-lg">{{ savedMessage }}</p>
          </div>

          <button (click)="resetToSetup()" class="w-full max-w-sm bg-slate-900 py-5 rounded-2xl text-white font-bold hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all">
            Start New Session
          </button>
        </div>
      }
    </section>

    <!-- SIDEBAR / HISTORY -->
    <aside class="bg-slate-50/50 border border-slate-200/50 rounded-[40px] p-8 flex flex-col h-full max-h-[700px] lg:sticky lg:top-10">
      <div class="flex items-center justify-between mb-8">
        <h3 class="text-xs font-black tracking-[0.2em] uppercase text-slate-400">Activity History</h3>
        <span class="bg-white border border-slate-200 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full shadow-sm">
          {{ paginationConfig().totalElements }} Total
        </span>
      </div>

      @if (sessionHistory.length === 0 && !isLoadingHistory()) {
        <div class="flex-1 flex flex-col items-center justify-center text-slate-300">
          <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 italic text-2xl font-serif">i</div>
          <p class="text-[11px] font-bold tracking-widest uppercase">No history yet</p>
        </div>
      } @else {
        <div class="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          @for (session of sessionHistory; track $index) {
            <div class="bg-white border border-slate-100 p-5 rounded-3xl flex items-center justify-between gap-4 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50/50 transition-all group cursor-default">
              <div class="flex items-center gap-4 overflow-hidden">
                <div class="h-10 w-10 shrink-0 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                   <span class="text-xs font-bold">#{{ $index + 1 }}</span>
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span class="text-sm font-bold text-slate-700 truncate tracking-tight">{{ session.title }}</span>
                  <span class="text-[10px] font-medium text-slate-400 uppercase">Focus Session</span>
                </div>
              </div>
              <span class="font-mono text-sm font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-lg">
                {{ session.timer | formatTimer }}
              </span>
            </div>
          }
        </div>
      }

      @if (paginationConfig().totalElements > 0) {
        <div class="mt-8 pt-6 border-t border-slate-200/60">
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
  // Services
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly focusSessionFacade = inject(FocusSessionFacadeService);
  private readonly userContext = inject(UserContextService);
  private readonly paginationService = inject(PaginationService);

  // State Signals
  readonly isLoadingHistory = signal(false);
  // We alias the service signal to match your template's call: paginationConfig()
  readonly paginationConfig = this.paginationService.paginationConfig;

  // Timer State
  phase: Phase = 'setup';
  sessionTitle = '';
  selectedSeconds = 25 * 60;
  remainingSeconds = 0;
  totalSeconds = 0;
  sessionHistory: any[] = [];
  savedMessage = '';

  // Custom Mode State
  customMode = false;
  customHours: number | null = 0;
  customMinutes: number | null = 25;

  readonly presets = PRESETS;
  readonly circumference = 2 * Math.PI * 100;
  private timerSubscription: Subscription | null = null;

  // --- Computed Getters ---

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
    return (h * 3600) + (m * 60);
  }

  // --- Lifecycle ---

  ngOnInit(): void {
    this.loadSessionHistory();
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
  }

  // --- History & Pagination ---

  loadSessionHistory(): void {
    const userId = this.userContext.user()?.id;
    if (!userId) return;

    this.isLoadingHistory.set(true);
    const { page, size } = this.paginationService.getParams();

    this.focusSessionFacade.getMySessions(page, size).subscribe({
      next: (res) => {
        this.sessionHistory = res.items;
        
        // Sync the service so paginationConfig() updates automatically
        this.paginationService.updateFromResponse({
          totalPages: res.totalPages,
          totalElements: res.totalItems,
          last: page >= res.totalPages - 1,
          first: page === 0
        });

        this.isLoadingHistory.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('History load error:', err);
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

  // --- Timer Actions ---

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
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  }

  startSession(): void {
    if (this.effectiveSeconds < 60) return;
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
    this.sessionTitle = ''; // Optional: clear title for new session
  }

  private tick(): void {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this.cdr.detectChanges();
      } else {
        this.timerSubscription?.unsubscribe();
        this.save(this.totalSeconds);
      }
    });
  }

  private save(elapsedSeconds: number): void {
    const displayTimer = new Date(elapsedSeconds * 1000).toISOString().substring(11, 19);
    const userId = this.userContext.user()?.id;

    const sessionData = {
      duration: Math.max(1, Math.floor(elapsedSeconds / 60)),
      title: this.sessionTitle || 'Focus Session'
    };

    this.savedMessage = `${sessionData.title} · ${displayTimer}`;
    this.phase = 'done';

    if (userId) {
      this.focusSessionFacade.create(sessionData).subscribe({
        next: () => this.loadSessionHistory(),
        error: () => this.addToLocalHistory(sessionData, displayTimer)
      });
    } else {
      this.addToLocalHistory(sessionData, displayTimer);
    }
  }

  private addToLocalHistory(sessionData: any, timer: string): void {
    // Local fallback if user is guest or API fails
    this.sessionHistory = [{ title: sessionData.title, timer: timer }, ...this.sessionHistory];
    this.cdr.detectChanges();
  }
}