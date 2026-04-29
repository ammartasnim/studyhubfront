import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { FocusSessionFacadeService } from '../api/facades/focus-session.facade';
import { UserContextService } from '../user-context.service';
import { FormatTimerPipe } from './format-timer.pipe';

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

@Component({
  selector: 'app-pomodoro-timer',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatTimerPipe],
  styles: [`
    .ring-progress {
      stroke: #3b82f6;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear;
    }
    .ring-progress.paused { stroke: #f59e0b;
     }
  `],
  templateUrl: './promodor.html'
})
export class PomodoroTimerComponent implements OnInit, OnDestroy {
  phase: Phase = 'setup';
  sessionTitle = '';
  selectedSeconds = 25 * 60;
  customMinutes: number | undefined = undefined;
  remainingSeconds = 0;
  totalSeconds = 0;
  sessionHistory: SessionHistoryItem[] = [];
  showAllHistory = false;
  savedMessage = '';

  readonly presets = PRESET_DURATIONS;
  readonly circumference = 2 * Math.PI * 54;

  private timerSubscription: Subscription | null = null;
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

  startSession(): void {
    this.totalSeconds = this.selectedSeconds;
    this.remainingSeconds = this.selectedSeconds;
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

  loadSessionHistory(): void {
    const userId = this.userContext.user()?.id;
    if (!userId) { 
      console.warn('No userId available for loading session history');
      this.sessionHistory = []; 
      return; 
    }

    // Using facade service - cleaner API
    this.focusSessionFacade.getByUser(userId).subscribe({
      next: (sessions) => {
        this.sessionHistory = sessions.map((s) => this.mapToHistoryItem(s));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load session history:', err);
        this.sessionHistory = [];
        this.cdr.detectChanges();
      },
    });
  }

  private mapToHistoryItem(s: any): SessionHistoryItem {
    return {
      title: s.title ?? '',
      timer: s.displayDuration ?? '00:00:00', // Already formatted by facade
      userId: s.userId ?? undefined,
      createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
    };
  }

private tick(): void {
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
    // timer is optional on the DTO but we always provide it
    const timer = new Date(elapsedSeconds * 1000).toISOString().substring(11, 19);
    const userId = this.userContext.user()?.id;

    const sessionData = {
      title: this.sessionTitle,
      duration: elapsedSeconds / 60 // Convert to minutes
    };

    this.savedMessage = `"${this.sessionTitle}" — ${timer}`;
    this.phase = 'done';

    if (userId) {
      // Using facade service
      this.focusSessionFacade.create(sessionData).subscribe({
        next: () => {
          this.loadSessionHistory();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.log(err.message);
          this.addToLocalHistory(sessionData, timer);
          this.cdr.detectChanges();
        },
      });
    } else {
      this.addToLocalHistory(sessionData, timer);
      this.cdr.detectChanges();
    }
  }

  private addToLocalHistory(sessionData: any, timer: string): void {
    const item: SessionHistoryItem = {
      title: sessionData.title,
      timer: timer ?? '00:00:00',
      userId: sessionData.userId,
      createdAt: new Date(),
    };
    this.sessionHistory = [item, ...this.sessionHistory];
    this.cdr.detectChanges();
  }
  
}