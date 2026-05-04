import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { FocusSessionFacadeService } from '../../api/facades/focus-session.facade';
import { UserFacadeService } from '../../api/facades/user.facade';
import { PostFacadeService } from '../../api/facades/post.facade';
import { CommunityFacadeService } from '../../api/facades';
import { CommentFacadeService } from '../../api/facades';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="p-8">
  <div class="mb-8">
    <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Overview</h2>
    <p class="text-sm text-slate-400 mt-1">Platform statistics at a glance</p>
  </div>

  <!-- Overview cards -->
  <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
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

  <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

    <!-- Badge distribution -->
    <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest mb-5">Badge Distribution</h3>
      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (i of [1,2,3]; track i) {
            <div class="h-6 bg-slate-100 rounded-lg animate-pulse"></div>
          }
        </div>
      } @else if (badgeEntries().length === 0) {
        <p class="text-sm text-slate-400">No badge data available.</p>
      } @else {
        <div class="flex flex-col gap-3">
          @for (entry of badgeEntries(); track entry.badge) {
            <div>
              <div class="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>{{ entry.badge }}</span>
                <span>{{ entry.count }}</span>
              </div>
              <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  [style.width]="entry.percent + '%'">
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Top focus users -->
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
              <span class="w-6 text-xs font-black text-slate-300 text-center">{{ i + 1 }}</span>
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
  private readonly http               = inject(HttpClient);
  private readonly focusFacade        = inject(FocusSessionFacadeService);
  private readonly userFacade         = inject(UserFacadeService);
  private readonly postFacade         = inject(PostFacadeService);
  private readonly communityFacade    = inject(CommunityFacadeService)
  private readonly commentFacade      = inject(CommentFacadeService);

  readonly loading      = signal(true);
  readonly userStats    = signal<any>(null);
  readonly postStats    = signal<any>(null);
  readonly commentStats = signal<any>(null);
  readonly communityStats = signal<any>(null);
  readonly focusStats   = signal<any>(null);
  readonly badges       = signal<Record<string, number>>({});
  readonly topUsers     = signal<{ userId: number; username: string; totalHours: number }[]>([]);

  readonly overviewCards = () => [
    { label: 'Total Users',        value: this.userStats()?.total        ?? '—', sub: `${this.userStats()?.banned ?? 0} banned` },
    { label: 'Total Posts',        value: this.postStats()?.total        ?? '—', sub: `${this.postStats()?.flagged ?? 0} flagged` },
    { label: 'Total Comments',     value: this.commentStats()?.total     ?? '—', sub: null },
    { label: 'Communities',        value: this.communityStats()?.total   ?? '—', sub: null },
    { label: 'Completed Sessions', value: this.focusStats()?.completed   ?? '—', sub: `${this.focusStats()?.active ?? 0} active now` },
  ];

  readonly badgeEntries = () => {
    const b = this.badges();
    if (!b || Object.keys(b).length === 0) return [];
    const max = Math.max(...Object.values(b));
    return Object.entries(b).map(([badge, count]) => ({
      badge,
      count,
      percent: max > 0 ? (count / max) * 100 : 0
    }));
  };

  ngOnInit() {
    forkJoin({
      users:       this.userFacade.getStats(),
      posts:       this.postFacade.getPostStats(),
      comments:    this.commentFacade.getStats(),
      communities: this.communityFacade.getStats(),
      focus:       this.focusFacade.getStats(),
      badges:      this.userFacade.getBadgeDistribution(),
      topUsers:    this.focusFacade.getTopUsers(),
    }).subscribe({
      next: res => {
        this.userStats.set(res.users);
        this.postStats.set(res.posts);
        this.commentStats.set(res.comments);
        this.communityStats.set(res.communities);
        this.focusStats.set(res.focus);
        this.badges.set(res.badges);
        this.topUsers.set(res.topUsers);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}