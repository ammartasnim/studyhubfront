import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

import { FocusSessionFacadeService } from '../../api/facades/focus-session.facade';
import { UserFacadeService } from '../../api/facades/user.facade';
import { PostFacadeService } from '../../api/facades/post.facade';
import { CommunityFacadeService } from '../../api/facades';
import { CommentFacadeService } from '../../api/facades';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
<div class="p-8 space-y-8">

  <!-- Header -->
  <div class="flex items-center justify-between">
  <div>
    <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Overview</h2>
    <p class="text-sm text-slate-400 mt-1">Platform statistics at a glance</p>
  </div>

  <button
    (click)="exportMonthlyReport()"
    [disabled]="loading()"
    class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
    Export CSV
  </button>
</div>

  <!-- Overview cards -->
  <div class="grid grid-cols-2 xl:grid-cols-5 gap-4">
    @for (card of overviewCards(); track card.label) {
      <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{{ card.label }}</p>
        @if (loading()) {
          <div class="h-8 w-16 bg-slate-100 rounded-lg animate-pulse"></div>
        } @else {
          <p class="text-3xl font-black text-slate-900">{{ card.value }}</p>
        }
        @if (card.sub) {
          <p class="text-xs text-slate-400 mt-1">{{ card.sub }}</p>
        }
      </div>
    }
  </div>

  <!-- Charts row 1: Line + Doughnut -->
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

    <!-- User Growth Line Chart -->
    <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest mb-5">User Growth (Last 7 Days)</h3>
      @if (loading()) {
        <div class="h-56 bg-slate-50 rounded-xl animate-pulse"></div>
      } @else {
        <div class="relative h-56">
          <canvas baseChart
            [data]="userGrowthData()"
            [options]="lineOptions"
            type="line">
          </canvas>
        </div>
      }
    </div>

    <!-- Badge Distribution Doughnut -->
    <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest mb-5">Badge Distribution</h3>
      @if (loading()) {
        <div class="h-56 bg-slate-50 rounded-xl animate-pulse"></div>
      } @else if (badgeEntries().length === 0) {
        <p class="text-sm text-slate-400">No badge data available.</p>
      } @else {
        <div class="relative h-56 flex items-center justify-center">
          <canvas baseChart
            [data]="badgeChartData()"
            [options]="doughnutOptions"
            type="doughnut">
          </canvas>
        </div>
      }
    </div>

  </div>

  <!-- Charts row 2: Bar + Leaderboard -->
  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

    <!-- Focus Trends Bar Chart -->
    <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest mb-5">Focus Sessions (Last 7 Days)</h3>
      @if (loading()) {
        <div class="h-56 bg-slate-50 rounded-xl animate-pulse"></div>
      } @else {
        <div class="relative h-56">
          <canvas baseChart
            [data]="focusTrendsData()"
            [options]="barOptions"
            type="bar">
          </canvas>
        </div>
      }
    </div>

    <!-- Top Focus Users Leaderboard -->
    <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest mb-5">Top Focus Users</h3>
      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="h-6 bg-slate-100 rounded-lg animate-pulse"></div>
          }
        </div>
      } @else if (topUsers().length === 0) {
        <p class="text-sm text-slate-400">No focus data yet.</p>
      } @else {
        <div class="flex flex-col gap-3">
          @for (u of topUsers(); track u.userId; let i = $index) {
            <div class="flex items-center gap-3">
              <span class="w-6 text-xs font-black text-center"
                [class]="i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-400' : 'text-slate-300'">
                {{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-slate-700 truncate">{{ u.username }}</p>
              </div>
              <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                {{ u.totalHours | number:'1.1-1' }}h
              </span>
            </div>
          }
        </div>
      }
    </div>

  </div>
</div>
  `
})
export class AdminStats implements OnInit {
  // ─── DEPENDENCIES ─────────────────────────────────────────────────────────

  private readonly focusFacade     = inject(FocusSessionFacadeService);
  private readonly userFacade      = inject(UserFacadeService);
  private readonly postFacade      = inject(PostFacadeService);
  private readonly communityFacade = inject(CommunityFacadeService);
  private readonly commentFacade   = inject(CommentFacadeService);

  // ─── STATE ────────────────────────────────────────────────────────────────

  readonly loading        = signal(true);
  readonly userStats      = signal<any>(null);
  readonly postStats      = signal<any>(null);
  readonly commentStats   = signal<any>(null);
  readonly communityStats = signal<any>(null);
  readonly focusStats     = signal<any>(null);
  readonly badges         = signal<Record<string, number>>({});
  readonly topUsers       = signal<{ userId: number; username: string; totalHours: number }[]>([]);
  readonly userGrowthRaw  = signal<{ date: string; count: number }[]>([]);
  readonly focusTrendsRaw = signal<{ date: string; count: number }[]>([]);

  // ─── PALETTE ─────────────────────────────────────────────────────────────
  private readonly indigo  = 'rgba(99,102,241,1)';
  private readonly indigoT = 'rgba(99,102,241,0.15)';
  private readonly palette = [
    'rgba(99,102,241,0.85)',   // indigo
    'rgba(168,85,247,0.85)',   // purple
    'rgba(236,72,153,0.85)',   // pink
    'rgba(20,184,166,0.85)',   // teal
    'rgba(245,158,11,0.85)',   // amber
    'rgba(16,185,129,0.85)',   // emerald
    'rgba(239,68,68,0.85)',    // red
    'rgba(59,130,246,0.85)',   // blue
    'rgba(107,114,128,0.85)',  // slate
    'rgba(234,179,8,0.85)',    // yellow
  ];

  // ─── CHART CONFIGS ────────────────────────────────────────────────────────
  readonly lineOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 } }
    }
  };

  readonly barOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 }, precision: 0 } }
    }
  };

  readonly doughnutOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#64748b', font: { size: 11 }, padding: 12, boxWidth: 12 }
      }
    }
  };

  // ─── COMPUTED CHART DATA ──────────────────────────────────────────────────
  readonly userGrowthData = (): ChartData<'line'> => ({
    labels: this.userGrowthRaw().map(d => this.formatDate(d.date)),
    datasets: [{
      data: this.userGrowthRaw().map(d => d.count),
      borderColor: this.indigo,
      backgroundColor: this.indigoT,
      borderWidth: 2,
      pointBackgroundColor: this.indigo,
      pointRadius: 4,
      tension: 0.4,
      fill: true
    }]
  });

  readonly focusTrendsData = (): ChartData<'bar'> => ({
    labels: this.focusTrendsRaw().map(d => this.formatDate(d.date)),
    datasets: [{
      data: this.focusTrendsRaw().map(d => d.count),
      backgroundColor: this.palette[0],
      borderRadius: 6,
      borderSkipped: false
    }]
  });

  readonly badgeChartData = (): ChartData<'doughnut'> => {
    const b = this.badges();
    const entries = Object.entries(b);
    return {
      labels: entries.map(([k]) => k),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: this.palette.slice(0, entries.length),
        borderWidth: 0,
        hoverOffset: 6
      }]
    };
  };

  readonly badgeEntries = () => {
    const b = this.badges();
    if (!b || Object.keys(b).length === 0) return [];
    const max = Math.max(...Object.values(b));
    return Object.entries(b).map(([badge, count]) => ({
      badge, count,
      percent: max > 0 ? (count / max) * 100 : 0
    }));
  };

  readonly overviewCards = () => [
    { label: 'Total Users',        value: this.userStats()?.total      ?? '—', sub: `${this.userStats()?.banned ?? 0} banned` },
    { label: 'Total Posts',        value: this.postStats()?.total      ?? '—', sub: `${this.postStats()?.flagged ?? 0} flagged` },
    { label: 'Total Comments',     value: this.commentStats()?.total   ?? '—', sub: null },
    { label: 'Communities',        value: this.communityStats()?.total ?? '—', sub: null },
    { label: 'Focus Sessions',     value: this.focusStats()?.completed ?? '—', sub: `${this.focusStats()?.active ?? 0} active now` },
  ];

  // ─── LIFECYCLE ────────────────────────────────────────────────────────────

  ngOnInit() {
    forkJoin({
      users:       this.userFacade.getStats(),
      posts:       this.postFacade.getPostStats(),
      comments:    this.commentFacade.getStats(),
      communities: this.communityFacade.getStats(),
      focus:       this.focusFacade.getStats(),
      badges:      this.userFacade.getBadgeDistribution(),
      topUsers:    this.focusFacade.getTopUsers(),
      userGrowth:  this.userFacade.getUserGrowth(),
      focusTrends: this.focusFacade.getFocusTrends(),
    }).subscribe({
      next: res => {
        this.userStats.set(res.users);
        this.postStats.set(res.posts);
        this.commentStats.set(res.comments);
        this.communityStats.set(res.communities);
        this.focusStats.set(res.focus);
        this.badges.set(res.badges);
        this.topUsers.set(res.topUsers);
        this.userGrowthRaw.set(res.userGrowth);
        this.focusTrendsRaw.set(res.focusTrends);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  exportMonthlyReport(): void {
  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const sections: string[] = [];

  // Header
  sections.push(`StudyHub Monthly Report — ${monthLabel}`);
  sections.push(`Generated: ${now.toLocaleString()}`);
  sections.push('');

  // Overview
  sections.push('=== OVERVIEW ===');
  sections.push('Metric,Value');
  sections.push(`Total Users,${this.userStats()?.total ?? 0}`);
  sections.push(`Banned Users,${this.userStats()?.banned ?? 0}`);
  sections.push(`Total Posts,${this.postStats()?.total ?? 0}`);
  sections.push(`Flagged Posts,${this.postStats()?.flagged ?? 0}`);
  sections.push(`Pending Posts,${this.postStats()?.pending ?? 0}`);
  sections.push(`Total Comments,${this.commentStats()?.total ?? 0}`);
  sections.push(`Total Communities,${this.communityStats()?.total ?? 0}`);
  sections.push(`Completed Focus Sessions,${this.focusStats()?.completed ?? 0}`);
  sections.push(`Active Focus Sessions,${this.focusStats()?.active ?? 0}`);
  sections.push('');

  // Badge distribution
  sections.push('=== BADGE DISTRIBUTION ===');
  sections.push('Badge,Users');
  const b = this.badges();
  Object.entries(b).forEach(([badge, count]) => {
    sections.push(`${badge},${count}`);
  });
  sections.push('');

  // User growth
  sections.push('=== USER GROWTH (LAST 7 DAYS) ===');
  sections.push('Date,New Users');
  this.userGrowthRaw().forEach(d => {
    sections.push(`${d.date},${d.count}`);
  });
  sections.push('');

  // Focus trends
  sections.push('=== FOCUS SESSION TRENDS (LAST 7 DAYS) ===');
  sections.push('Date,Completed Sessions');
  this.focusTrendsRaw().forEach(d => {
    sections.push(`${d.date},${d.count}`);
  });
  sections.push('');

  // Top focus users
  sections.push('=== TOP FOCUS USERS ===');
  sections.push('Rank,Username,Total Hours');
  this.topUsers().forEach((u, i) => {
    sections.push(`${i + 1},${u.username},${u.totalHours.toFixed(1)}`);
  });

  const csvContent = sections.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `studyhub-report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}