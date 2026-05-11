import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PostFacadeService } from '../../api/facades/post.facade';

@Component({
  selector: 'app-admin-post-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="p-8">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h2 class="text-2xl font-extrabold text-slate-900">Post Reports</h2>
      <p class="text-sm text-slate-400 mt-1">
        A post is flagged after {{ threshold }} approved reports
      </p>
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
      <div class="text-center py-16 text-slate-400 text-sm">No Posts found.</div>
    } @else {
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-100">
            <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400">Post</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400">Author</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400">Community</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400">Reports</th>
            <th class="px-5 py-3 text-left text-xs font-semibold text-slate-400">Post Status</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          @for (r of filtered(); track r.postId) {

            <!-- ── Main row ── -->
            <tr class="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                [class.bg-red-50]="r.status === 'Flagged'"
                [class.hover:bg-red-100]="r.status === 'Flagged'"
                (click)="toggleExpand(r.postId)">

              <td class="px-5 py-3.5 font-semibold text-slate-800">
                <div class="flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-slate-400 transition-transform flex-shrink-0"
                    [class.rotate-90]="expanded().has(r.postId)"
                    fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M7.293 4.707a1 1 0 011.414 0L14.414 10l-5.707 5.707a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"/>
                  </svg>
                  {{ r.title }}
                </div>
              </td>

              <td class="px-5 py-3.5 text-slate-500">{{ r.authorUsername }}</td>
              <td class="px-5 py-3.5 text-slate-500">{{ r.communityTitle }}</td>

              <td class="px-5 py-3.5">
                <span class="font-semibold"
                  [class.text-red-600]="r.approvedReports >= threshold"
                  [class.text-amber-500]="r.approvedReports > 0 && r.approvedReports < threshold"
                  [class.text-slate-400]="r.approvedReports === 0">
                  {{ r.approvedReports }} / {{ threshold }} approved
                </span>
                <span class="text-slate-300 text-xs ml-1">({{ r.totalReports }} total)</span>
              </td>

              <td class="px-5 py-3.5">
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
                  [class.bg-red-100]="r.status === 'Flagged'"
                  [class.text-red-600]="r.status === 'Flagged'"
                  [class.bg-green-100]="r.status === 'Approved'"
                  [class.text-green-700]="r.status === 'Approved'"
                  [class.bg-slate-100]="r.status === 'Pending'"
                  [class.text-slate-500]="r.status === 'Pending'">
                  {{ r.status }}
                </span>
              </td>

              <td class="px-5 py-3.5 text-right text-xs text-slate-300">
                <div class="flex items-center justify-end gap-3">
                  <span>{{ r.latestReportDate | date:'MMM d, y' }}</span>
                  <button (click)="openPostModal(r, $event)"
                    class="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition whitespace-nowrap">
                    View Post
                  </button>
                </div>
              </td>
            </tr>

            <!-- ── Expanded section ── -->
            @if (expanded().has(r.postId)) {

              <!-- Reasons row -->
              <tr class="bg-slate-50 border-b border-slate-100">
                <td colspan="6" class="px-8 py-2">
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

              <!-- Individual report rows -->
              @if (loadingDetails().has(r.postId)) {
                <tr class="bg-slate-50 border-b border-slate-100">
                  <td colspan="6" class="pl-12 py-3 text-xs text-slate-400">Loading...</td>
                </tr>
              } @else if (reportDetails()[r.postId]?.length === 0) {
                <tr class="bg-slate-50 border-b border-slate-100">
                  <td colspan="6" class="pl-12 py-3 text-xs text-slate-400">No individual reports found.</td>
                </tr>
              } @else {
               @for (rep of getVisibleReports(r.postId); track rep.id) {
  <tr class="border-b border-slate-100 bg-slate-50/60">
    
    <!-- reporter -->
    <td class="pl-12 py-2.5 text-xs font-semibold text-slate-700">
      {{ rep.reporterUsername }}
    </td>

    <!-- reason + context -->
    <td class="px-5 py-2.5 text-xs text-slate-500">
      {{ formatReason(rep.reason) }}
      @if (rep.additionalContext) {
        <span class="text-slate-400 italic"> — "{{ rep.additionalContext }}"</span>
      }
    </td>

    <!-- date -->
    <td class="px-5 py-2.5 text-xs text-slate-400">
      {{ rep.createdAt | date:'MMM d' }}
    </td>

    <!-- status / actions -->
    <td colspan="3" class="px-5 py-2.5 text-right">
      @if (rep.status === 'PENDING') {
        <div class="flex gap-2 justify-end">
          <button
            (click)="approveReport(rep.id, r.postId); $event.stopPropagation()"
            [disabled]="actingOnReport() === rep.id"
            class="px-3 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 transition">
            {{ actingOnReport() === rep.id ? '...' : 'Approve' }}
          </button>
          <button
            (click)="rejectReport(rep.id, r.postId); $event.stopPropagation()"
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

@if (selectedPost() !== null) {
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
       (click)="selectedPost.set(null)">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
         (click)="$event.stopPropagation()">

      <!-- Modal header -->
      <div class="flex items-start justify-between px-6 py-4 border-b border-slate-100">
        <div class="flex-1 min-w-0 pr-4">
          <h3 class="text-lg font-bold text-slate-900 truncate">{{ selectedPost()?.title }}</h3>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
              [class.bg-red-100]="selectedPost()?.status === 'Flagged'"
              [class.text-red-600]="selectedPost()?.status === 'Flagged'"
              [class.bg-green-100]="selectedPost()?.status === 'Approved'"
              [class.text-green-700]="selectedPost()?.status === 'Approved'"
              [class.bg-slate-100]="selectedPost()?.status === 'Pending'"
              [class.text-slate-500]="selectedPost()?.status === 'Pending'">
              {{ selectedPost()?.status }}
            </span>
            @if (selectedPost()?.communityTitle) {
              <span class="text-xs text-slate-400">in <span class="font-semibold text-slate-600">{{ selectedPost()?.communityTitle }}</span></span>
            }
          </div>
        </div>
        <button (click)="selectedPost.set(null)"
          class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Author + date -->
      <div class="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          @if (selectedPost()?.userPfp) {
            <img [src]="imageUrl(selectedPost()?.userPfp)" class="w-full h-full object-cover" />
          } @else {
            <span class="text-indigo-700 font-bold text-sm">{{ (selectedPost()?.authorUsername || '?')[0].toUpperCase() }}</span>
          }
        </div>
        <div>
          <p class="font-semibold text-slate-800 text-sm">{{ selectedPost()?.authorUsername }}</p>
          <p class="text-xs text-slate-400">{{ selectedPost()?.postCreatedAt | date:'MMM d, y · h:mm a' }}</p>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 border-b border-slate-100">
        <p class="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{{ selectedPost()?.content }}</p>
      </div>

      <!-- Images -->
      @if (selectedPost()?.imgs?.length > 0) {
        <div class="px-6 py-4 border-b border-slate-100">
          <div class="flex flex-wrap gap-2">
            @for (img of selectedPost()?.imgs; track img) {
              <img [src]="imageUrl(img)" class="h-32 rounded-xl object-cover border border-slate-100" />
            }
          </div>
        </div>
      }

      <!-- Report summary -->
      <div class="px-6 py-4">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Report Summary</p>
        <div class="flex items-center gap-4 mb-3">
          <span class="text-sm font-semibold"
            [class.text-red-600]="selectedPost()?.approvedReports >= threshold"
            [class.text-amber-500]="selectedPost()?.approvedReports > 0 && selectedPost()?.approvedReports < threshold"
            [class.text-slate-400]="selectedPost()?.approvedReports === 0">
            {{ selectedPost()?.approvedReports }} / {{ threshold }} approved
          </span>
          <span class="text-xs text-slate-400">({{ selectedPost()?.totalReports }} total)</span>
        </div>
        <div class="flex flex-wrap gap-2">
          @for (entry of toEntries(selectedPost()?.reasons); track entry[0]) {
            <span class="text-xs px-2.5 py-0.5 bg-slate-100 rounded-full text-slate-600">
              {{ formatReason(entry[0]) }} <span class="font-bold text-slate-800">×{{ entry[1] }}</span>
            </span>
          }
        </div>
      </div>

    </div>
  </div>
}
`
})
export class AdminPostReports implements OnInit {
  // ─── DEPENDENCIES ─────────────────────────────────────────────────────────

  private readonly facade  = inject(PostFacadeService);
  private readonly http    = inject(HttpClient);

  private get basePath(): string {
    return (this.facade as any)['postController']?.['configuration']?.basePath
      ?? 'http://localhost:8081';
  }

  // ─── STATE ────────────────────────────────────────────────────────────────

  readonly reports        = signal<any[]>([]);
  readonly loading        = signal(false);
  readonly activeTab      = signal<string>('ALL');
  readonly expanded       = signal<Set<number>>(new Set());
  readonly reportDetails  = signal<Record<number, any[]>>({});
  readonly loadingDetails = signal<Set<number>>(new Set());
  readonly actingOnReport = signal<number | null>(null);
  readonly selectedPost    = signal<any | null>(null);

  readonly threshold = 5;

  readonly tabs = [
    { label: 'All',      value: 'ALL'      },
    { label: 'Pending',  value: 'PENDING'  },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Flagged',  value: 'FLAGGED'  },
  ];

  // ─── COMPUTED ─────────────────────────────────────────────────────────────

  filtered() {
    const tab = this.activeTab();
    const all = this.reports();
    if (tab === 'ALL') return all;
    if (tab === 'FLAGGED') return all.filter(r => r.status === 'Flagged');
    return all.filter(r => {
      const details = this.reportDetails()[r.postId];
      if (!details) {
        if (tab === 'PENDING') return r.hasPendingReports;
        return true;
      }
      return details.some(rep => rep.status === tab);
    });
  }

  getVisibleReports(postId: number): any[] {
    const tab = this.activeTab();
    const details = this.reportDetails()[postId] ?? [];
    if (tab === 'ALL' || tab === 'FLAGGED') return details;
    return details.filter(rep => rep.status === tab);
  }

  // ─── LIFECYCLE ────────────────────────────────────────────────────────────

  ngOnInit() { this.loadGrouped(); }

  // ─── DATA LOADING ─────────────────────────────────────────────────────────

  loadGrouped() {
    this.loading.set(true);
    this.facade.getGroupedPostReports().subscribe({
      next: res => { this.reports.set(res); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  loadDetailsForPost(postId: number) {
    this.loadingDetails.update(s => { const n = new Set(s); n.add(postId); return n; });
    this.http.get<any[]>(`${this.basePath}/api/reports/posts/${postId}`).subscribe({
      next: items => {
        this.reportDetails.update(d => ({ ...d, [postId]: items }));
        this.loadingDetails.update(s => { const n = new Set(s); n.delete(postId); return n; });
      },
      error: () => {
        this.reportDetails.update(d => ({ ...d, [postId]: [] }));
        this.loadingDetails.update(s => { const n = new Set(s); n.delete(postId); return n; });
      }
    });
  }

  // ─── ACTIONS ─────────────────────────────────────────────────────────────

  toggleExpand(postId: number) {
    const s = new Set(this.expanded());
    if (s.has(postId)) {
      s.delete(postId);
    } else {
      s.add(postId);
      this.loadDetailsForPost(postId);
    }
    this.expanded.set(s);
  }

  approveReport(reportId: number, postId: number) {
    this.actingOnReport.set(reportId);
    this.http.patch<any>(`${this.basePath}/api/reports/${reportId}/approve`, {}).subscribe({
      next: () => {
        this.actingOnReport.set(null);
        this.loadDetailsForPost(postId);
        this.loadGrouped();
      },
      error: () => this.actingOnReport.set(null)
    });
  }

  rejectReport(reportId: number, postId: number) {
    this.actingOnReport.set(reportId);
    this.http.patch<any>(`${this.basePath}/api/reports/${reportId}/reject`, {}).subscribe({
      next: () => {
        this.actingOnReport.set(null);
        this.loadDetailsForPost(postId);
        this.loadGrouped();
      },
      error: () => this.actingOnReport.set(null)
    });
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  toEntries(obj: Record<string, number>): [string, number][] {
    return Object.entries(obj ?? {});
  }

  formatReason(raw: string): string {
    return (raw ?? '').replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  openPostModal(r: any, event: Event) {
    event.stopPropagation();
    this.selectedPost.set(r);
  }

  imageUrl(path?: string | null): string {
    if (!path) return '';
    return `${this.basePath}/uploads/${path}`;
  }
}