import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostFacadeService, ReportReqDto } from '../../facades/post.facade';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export type ReportTargetType = 'POST' | 'COMMENT';

const REASONS: { value: ReportReqDto['reason']; label: string }[] = [
  { value: 'SPAM',                 label: 'Spam' },
  { value: 'HARASSMENT',          label: 'Harassment' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content' },
  { value: 'MISINFORMATION',      label: 'Misinformation' },
  { value: 'HATE_SPEECH',         label: 'Hate Speech' },
  { value: 'OTHER',               label: 'Other' },
];

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="close()">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-[slideUp_0.2s_ease]" (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="text-lg font-bold text-slate-900">Report {{ targetType() === 'POST' ? 'Post' : 'Comment' }}</h2>
              <p class="text-xs text-slate-500 mt-0.5">Help us understand what's wrong</p>
            </div>
            <button (click)="close()" class="text-slate-400 hover:text-slate-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Reason selection -->
          <div class="space-y-2 mb-4">
            <p class="text-sm font-semibold text-slate-700 mb-2">Select a reason</p>
            @for (r of reasons; track r.value) {
              <label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                [class.border-indigo-300]="selectedReason() === r.value"
                [class.bg-indigo-50]="selectedReason() === r.value"
                [class.border-slate-200]="selectedReason() !== r.value"
                [class.hover:bg-slate-50]="selectedReason() !== r.value"
              >
                <input
                  type="radio"
                  [value]="r.value"
                  [checked]="selectedReason() === r.value"
                  (change)="selectedReason.set(r.value)"
                  class="accent-indigo-600"
                />
                <span class="text-sm font-medium text-slate-800">{{ r.label }}</span>
              </label>
            }
          </div>

          <!-- Additional context -->
          <div class="mb-5">
            <label class="block text-sm font-semibold text-slate-700 mb-1">
              Additional context <span class="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              [(ngModel)]="additionalContext"
              placeholder="Describe the issue in more detail..."
              rows="3"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
            ></textarea>
          </div>

          <!-- Error -->
          @if (error()) {
            <div class="mb-4 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {{ error() }}
            </div>
          }

          <!-- Buttons -->
          <div class="flex gap-3">
            <button (click)="close()" class="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              (click)="submit()"
              [disabled]="!selectedReason() || submitting()"
              class="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              @if (submitting()) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Submitting...
              } @else {
                Submit Report
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slideUp {
      from { transform: translateY(16px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
  `]
})
export class ReportModalComponent {
  private readonly postFacade = inject(PostFacadeService);

  readonly isOpen       = signal(false);
  readonly submitting   = signal(false);
  readonly error        = signal<string | null>(null);
  readonly selectedReason = signal<ReportReqDto['reason'] | null>(null);
  readonly targetType   = signal<ReportTargetType>('POST');
  readonly targetId     = signal<number>(0);

  additionalContext = '';
  readonly reasons = REASONS;

  readonly reported = output<void>();

  open(targetType: ReportTargetType, targetId: number): void {
    this.targetType.set(targetType);
    this.targetId.set(targetId);
    this.selectedReason.set(null);
    this.additionalContext = '';
    this.error.set(null);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  async submit(): Promise<void> {
    const reason = this.selectedReason();
    if (!reason) return;

    this.submitting.set(true);
    this.error.set(null);

    const request: ReportReqDto = {
      reason,
      additionalContext: this.additionalContext.trim() || undefined
    };

    try {
      if (this.targetType() === 'POST') {
        await firstValueFrom(this.postFacade.reportPost(this.targetId(), request));
      } else {
        await firstValueFrom(this.postFacade.reportComment(this.targetId(), request));
      }
      this.reported.emit();
      this.close();
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}