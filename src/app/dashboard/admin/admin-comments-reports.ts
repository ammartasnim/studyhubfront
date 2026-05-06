import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-comment-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="p-8">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-2xl font-extrabold text-slate-900">Comment Reports</h2>
      <p class="text-sm text-slate-400 mt-1">Review reported comments</p>
    </div>
    <div class="flex gap-2">
      @for (tab of tabs; track tab.value) {
        <button (click)="activeTab.set(tab.value)"
          class="px-4 py-1.5 text-xs font-bold rounded-lg border transition"
          [class.bg-slate-900]="activeTab() === tab.value"
          [class.text-white]="activeTab() === tab.value"
          [class.border-slate-900]="activeTab() === tab.value"
          [class.bg-white]="activeTab() !== tab.value"
          [class.text-slate-500]="activeTab() !== tab.value"
          [class.border-slate-200]="activeTab() !== tab.value">
          {{ tab.label }}
        </button>
      }
    </div>
  </div>

  <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
    @if (loading()) {
      <div class="text-center py-16 text-slate-400 text-sm">Loading...</div>
    } @else if (filtered().length === 0) {
      <div class="text-center py-16 text-slate-400 text-sm">No Comments found.</div>
    } @else {
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100">
            <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400">Comment</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400">Author</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400">Post</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400">Reports</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400">Comment Status</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          @for (r of filtered(); track r.commentId) {

            <tr class="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                [class.bg-red-50]="r.status === 'Flagged'"
                (click)="toggleExpand(r.commentId)">
              <td class="px-5 py-3.5 font-semibold text-slate-800">
                <div class="flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0"
                    [class.rotate-90]="expanded().has(r.commentId)"
                    fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M7.293 4.707a1 1 0 011.414 0L14.414 10l-5.707 5.707a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"/>
                  </svg>
                  <span class="text-slate-600 italic">"{{ r.content }}"</span>
                </div>
              </td>
              <td class="px-5 py-3.5 text-slate-500">{{ r.authorUsername }}</td>
              <td class="px-5 py-3.5 text-slate-500">{{ r.postTitle }}</td>
              <td class="px-5 py-3.5">
                <span class="font-semibold"
                  [class.text-slate-400]="r.approvedReports === 0"
                  [class.text-amber-500]="r.approvedReports > 0">
                  {{ r.approvedReports }}/5 approved
                </span>
                <span class="text-slate-300 text-xs ml-1">({{ r.totalReports }} total)</span>
              </td>
               <td class="px-5 py-3.5">
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
                  [class.bg-red-100]="r.status === 'Flagged'"
                  [class.text-red-600]="r.status === 'Flagged'"
                  [class.bg-green-100]="r.status === 'Active'"
                  [class.text-green-700]="r.status === 'Active'">
                  {{ r.status }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-right text-xs text-slate-300">
                {{ r.latestReportDate | date:'MMM d, y' }}
              </td>
            </tr>

            @if (expanded().has(r.commentId)) {
              <!-- Reasons row -->
              <tr class="bg-slate-50 border-b border-slate-100">
                <td colspan="5" class="px-8 py-2">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wide mr-1">Reasons:</span>
                    @for (entry of toEntries(r.reasons); track entry[0]) {
                      <span class="text-xs px-2.5 py-0.5 bg-white border border-slate-200 rounded-full text-slate-600">
                        {{ formatReason(entry[0]) }}
                        <span class="font-bold text-slate-800">×{{ entry[1] }}</span>
                      </span>
                    }
                  </div>
                </td>
              </tr>

              <!-- Individual reports -->
              @if (loadingDetails().has(r.commentId)) {
                <tr class="bg-slate-50 border-b border-slate-100">
                  <td colspan="5" class="pl-12 py-3 text-xs text-slate-400">Loading...</td>
                </tr>
              } @else {
                @for (rep of getVisibleReports(r.commentId); track rep.id) {
                  <tr class="border-b border-slate-100 bg-slate-50/60">
                    <td class="pl-12 py-2.5 text-xs text-slate-600">
                      <span class="font-semibold text-slate-700">{{ rep.reporterUsername }}</span>
                      <span class="text-slate-300 mx-1.5">·</span>
                      <span class="text-slate-500">{{ formatReason(rep.reason) }}</span>
                      @if (rep.additionalContext) {
                        <span class="text-slate-400 italic"> — "{{ rep.additionalContext }}"</span>
                      }
                    </td>
                    <td class="px-5 py-2.5 text-xs text-slate-400" colspan="2">
                      {{ rep.createdAt | date:'MMM d' }}
                    </td>
                    <td colspan="2" class="px-5 py-2.5 text-right">
                      @if (rep.status === 'PENDING') {
                        <div class="flex gap-2 justify-end">
                          <button (click)="approveReport(rep.id, r.commentId); $event.stopPropagation()"
                            [disabled]="actingOnReport() === rep.id"
                            class="px-3 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 transition">
                            {{ actingOnReport() === rep.id ? '...' : 'Approve' }}
                          </button>
                          <button (click)="rejectReport(rep.id, r.commentId); $event.stopPropagation()"
                            [disabled]="actingOnReport() === rep.id"
                            class="px-3 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 transition">
                            {{ actingOnReport() === rep.id ? '...' : 'Reject' }}
                          </button>
                        </div>
                      } @else {
                        <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
                          [class.bg-green-100]="rep.status === 'APPROVED'"
                          [class.text-green-700]="rep.status === 'APPROVED'"
                          [class.bg-red-100]="rep.status === 'REJECTED'"
                          [class.text-red-500]="rep.status === 'REJECTED'">
                          {{ rep.status | titlecase }}
                        </span>
                      }
                    </td>
                  </tr>
                }
              }
            }
          }
        </tbody>
      </table>
    }
  </div>
</div>
`
})
export class AdminCommentReports implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly basePath = 'http://localhost:8081';

  readonly reports        = signal<any[]>([]);
  readonly loading        = signal(false);
  readonly activeTab      = signal<string>('ALL');
  readonly expanded       = signal<Set<number>>(new Set());
  readonly reportDetails  = signal<Record<number, any[]>>({});
  readonly loadingDetails = signal<Set<number>>(new Set());
  readonly actingOnReport = signal<number | null>(null);

readonly tabs = [
  { label: 'All',      value: 'ALL'      },
  { label: 'Pending',  value: 'PENDING'  },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Flagged',  value: 'FLAGGED'  },  
];

filtered() {
  const tab = this.activeTab();
  const all = this.reports();
  if (tab === 'ALL') return all;
  if (tab === 'FLAGGED') return all.filter(r => r.status === 'Flagged');
  return all.filter(r => {
    const details = this.reportDetails()[r.commentId];
    if (!details) return tab === 'PENDING' ? r.hasPendingReports : true;
    return details.some(rep => rep.status === tab);
  });
}

  getVisibleReports(commentId: number): any[] {
    const tab = this.activeTab();
    const details = this.reportDetails()[commentId] ?? [];
    if (tab === 'ALL') return details;
    return details.filter(rep => rep.status === tab);
  }

  toEntries(obj: Record<string, number>): [string, number][] {
    return Object.entries(obj ?? {});
  }

  formatReason(raw: string): string {
    return (raw ?? '').replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  ngOnInit() { this.loadGrouped(); }

  loadGrouped() {
    this.loading.set(true);
    this.http.get<any[]>(`${this.basePath}/api/reports/comments/grouped`).subscribe({
      next: res => { this.reports.set(res); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  toggleExpand(commentId: number) {
    const s = new Set(this.expanded());
    if (s.has(commentId)) {
      s.delete(commentId);
    } else {
      s.add(commentId);
      this.loadDetailsForComment(commentId);
    }
    this.expanded.set(s);
  }

  loadDetailsForComment(commentId: number) {
    this.loadingDetails.update(s => { const n = new Set(s); n.add(commentId); return n; });
    this.http.get<any[]>(`${this.basePath}/api/reports/comments/${commentId}`).subscribe({
      next: items => {
        this.reportDetails.update(d => ({ ...d, [commentId]: items }));
        this.loadingDetails.update(s => { const n = new Set(s); n.delete(commentId); return n; });
      },
      error: () => {
        this.reportDetails.update(d => ({ ...d, [commentId]: [] }));
        this.loadingDetails.update(s => { const n = new Set(s); n.delete(commentId); return n; });
      }
    });
  }

  approveReport(reportId: number, commentId: number) {
    this.actingOnReport.set(reportId);
    this.http.patch<any>(`${this.basePath}/api/reports/${reportId}/approve`, {}).subscribe({
      next: () => {
        this.actingOnReport.set(null);
        this.loadDetailsForComment(commentId);
        this.loadGrouped();
      },
      error: () => this.actingOnReport.set(null)
    });
  }

  rejectReport(reportId: number, commentId: number) {
    this.actingOnReport.set(reportId);
    this.http.patch<any>(`${this.basePath}/api/reports/${reportId}/reject`, {}).subscribe({
      next: () => {
        this.actingOnReport.set(null);
        this.loadDetailsForComment(commentId);
        this.loadGrouped();
      },
      error: () => this.actingOnReport.set(null)
    });
  }
}