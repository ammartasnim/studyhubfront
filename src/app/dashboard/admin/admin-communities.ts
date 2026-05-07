import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommunityFacadeService } from '../../api/facades/community.facade';
import { CommunityUI } from '../../api/facades/models/community.model';

@Component({
  selector: 'app-admin-communities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-8">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Communities</h2>
    <span class="text-sm text-slate-400">{{ total() }} total</span>
  </div>

  <div class="mb-6">
    <input [(ngModel)]="search" (ngModelChange)="onSearch()"
      placeholder="Search by title..."
      class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"/>
  </div>

  <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-100 bg-slate-50">
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Community</th>
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Members</th>
          <th class="px-5 py-3.5"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-50">
        @if (loading()) {
          <tr><td colspan="4" class="text-center py-10 text-slate-400 text-sm">Loading...</td></tr>
        } @else if (communities().length === 0) {
          <tr><td colspan="4" class="text-center py-10 text-slate-400 text-sm">No communities found.</td></tr>
        }
        @for (c of communities(); track c.id) {
          <tr class="hover:bg-slate-50 transition-colors cursor-pointer"
              (click)="openModeration(c)">
            <td class="px-5 py-3.5 font-semibold text-slate-800">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {{ c.title.substring(0, 2).toUpperCase() }}
                </div>
                {{ c.title }}
              </div>
            </td>
            <td class="px-5 py-3.5 text-slate-500 max-w-sm truncate">{{ c.description }}</td>
            <td class="px-5 py-3.5 text-slate-500">
              <span class="inline-flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                {{ c.nbrMembers }}
              </span>
            </td>
            <td class="px-5 py-3.5 text-right" (click)="$event.stopPropagation()">
              <button (click)="confirmDelete(c)"
                class="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                Delete
              </button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>

  <div class="flex items-center justify-between mt-4">
    <span class="text-xs text-slate-400">Page {{ page() + 1 }} of {{ totalPages() }}</span>
    <div class="flex gap-2">
      <button (click)="prevPage()" [disabled]="page() === 0"
        class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">Previous</button>
      <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
        class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
    </div>
  </div>
</div>

<!-- ── Delete modal ── -->
@if (deleteTarget()) {
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
      <div class="flex items-center gap-4 mb-4">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div>
          <h3 class="font-bold text-slate-900">Delete Community?</h3>
          <p class="text-sm text-slate-500 mt-0.5">c/{{ deleteTarget()?.title }}</p>
        </div>
      </div>
      <p class="text-sm text-slate-600 mb-6">All posts in this community will be permanently removed. This cannot be undone.</p>
      <div class="flex gap-3">
        <button (click)="cancelDelete()" class="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50">Cancel</button>
        <button (click)="executeDelete()" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Delete</button>
      </div>
    </div>
  </div>
}

<!-- ── Moderation modal ── -->
@if (moderationTarget()) {
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
       (click)="closeModeration()">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
         (click)="$event.stopPropagation()">

      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
            {{ moderationTarget()!.title.substring(0, 2).toUpperCase() }}
          </div>
          <div>
            <h3 class="font-bold text-slate-900">{{ moderationTarget()!.title }}</h3>
            <p class="text-xs text-slate-400">Moderation history</p>
          </div>
        </div>
        <button (click)="closeModeration()" class="text-slate-400 hover:text-slate-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 px-6 pt-4">
        <button (click)="modTab.set('bans')"
          class="px-4 py-1.5 text-xs font-bold rounded-lg transition"
          [class.bg-slate-900]="modTab() === 'bans'"
          [class.text-white]="modTab() === 'bans'"
          [class.bg-slate-100]="modTab() !== 'bans'"
          [class.text-slate-500]="modTab() !== 'bans'">
          Bans
          @if (moderation()?.bans?.length) {
            <span class="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
              [class.bg-white]="modTab() === 'bans'"
              [class.text-slate-900]="modTab() === 'bans'"
              [class.bg-slate-200]="modTab() !== 'bans'">
              {{ moderation()!.bans.length }}
            </span>
          }
        </button>
        <button (click)="modTab.set('warnings')"
          class="px-4 py-1.5 text-xs font-bold rounded-lg transition"
          [class.bg-slate-900]="modTab() === 'warnings'"
          [class.text-white]="modTab() === 'warnings'"
          [class.bg-slate-100]="modTab() !== 'warnings'"
          [class.text-slate-500]="modTab() !== 'warnings'">
          Warnings
          @if (moderation()?.warnings?.length) {
            <span class="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
              [class.bg-white]="modTab() === 'warnings'"
              [class.text-slate-900]="modTab() === 'warnings'"
              [class.bg-slate-200]="modTab() !== 'warnings'">
              {{ moderation()!.warnings.length }}
            </span>
          }
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-4">

        @if (moderationLoading()) {
          <div class="text-center py-10 text-slate-400 text-sm">Loading...</div>
        } @else if (modTab() === 'bans') {

          @if (!moderation()?.bans?.length) {
            <div class="text-center py-10 text-slate-400 text-sm">No bans in this community.</div>
          } @else {
            <div class="space-y-3">
              @for (ban of moderation()!.bans; track ban.id) {
                <div class="flex items-start justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-red-200 text-red-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {{ (ban.firstName?.[0] ?? '') + (ban.lastName?.[0] ?? '') | uppercase }}
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800 text-sm">
                        {{ ban.firstName }} {{ ban.lastName }}
                        <span class="text-slate-400 font-normal ml-1">&#64;{{ ban.username }}</span>
                      </p>
                      <p class="text-xs text-red-600 mt-0.5">
                        {{ ban.reason || 'No reason provided' }}
                      </p>
                    </div>
                  </div>
                  <span class="text-xs text-slate-400 flex-shrink-0 mt-1">
                    {{ ban.bannedAt | date:'MMM d, y' }}
                  </span>
                </div>
              }
            </div>
          }

        } @else {

          @if (!moderation()?.warnings?.length) {
            <div class="text-center py-10 text-slate-400 text-sm">No warnings in this community.</div>
          } @else {
            <div class="space-y-3">
              @for (warn of moderation()!.warnings; track warn.id) {
                <div class="flex items-start justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {{ (warn.firstName?.[0] ?? '') + (warn.lastName?.[0] ?? '') | uppercase }}
                    </div>
                    <div>
                      <p class="font-semibold text-slate-800 text-sm">
                        {{ warn.firstName }} {{ warn.lastName }}
                        <span class="text-slate-400 font-normal ml-1">&#64;{{ warn.username }}</span>
                      </p>
                      <p class="text-xs text-amber-600 mt-0.5">
                        {{ warn.reason || 'No reason provided' }}
                      </p>
                    </div>
                  </div>
                  <span class="text-xs text-slate-400 flex-shrink-0 mt-1">
                    {{ warn.warnedAt | date:'MMM d, y' }}
                  </span>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  </div>
}
  `
})
export class AdminCommunities implements OnInit {
  private readonly communityFacade = inject(CommunityFacadeService);
  private readonly http = inject(HttpClient);
  private readonly basePath = 'http://localhost:8081';

  readonly communities      = signal<CommunityUI[]>([]);
  readonly total            = signal(0);
  readonly page             = signal(0);
  readonly loading          = signal(false);
  readonly deleteTarget     = signal<CommunityUI | null>(null);
  readonly moderationTarget = signal<CommunityUI | null>(null);
  readonly moderation       = signal<any | null>(null);
  readonly moderationLoading = signal(false);
  readonly modTab           = signal<'bans' | 'warnings'>('bans');

  readonly size = 10;
  search = '';
  private searchTimer: any;
  readonly totalPages = () => Math.ceil(this.total() / this.size);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.communityFacade.getAll({
      title: this.search || undefined,
      page: this.page(),
      size: this.size
    }).subscribe({
      next: res => {
        this.communities.set(res.items);
        this.total.set(res.totalItems);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(0); this.load(); }, 400);
  }

  // ── moderation modal ──────────────────────────────────────────────────────

  openModeration(c: CommunityUI) {
    this.moderationTarget.set(c);
    this.moderation.set(null);
    this.modTab.set('bans');
    this.moderationLoading.set(true);
    this.http.get<any>(`${this.basePath}/api/communities/${c.id}/moderation`).subscribe({
      next: data => {
        this.moderation.set(data);
        this.moderationLoading.set(false);
      },
      error: () => this.moderationLoading.set(false)
    });
  }

  closeModeration() {
    this.moderationTarget.set(null);
    this.moderation.set(null);
  }

  // ── delete modal ──────────────────────────────────────────────────────────

  confirmDelete(c: CommunityUI) { this.deleteTarget.set(c); }
  cancelDelete()                { this.deleteTarget.set(null); }

  executeDelete() {
    const target = this.deleteTarget();
    if (!target) return;
    this.communityFacade.delete(target.id).subscribe({
      next: () => {
        this.communities.update(list => list.filter(c => c.id !== target.id));
        this.total.update(t => t - 1);
        this.deleteTarget.set(null);
      }
    });
  }

  prevPage() { this.page.update(p => p - 1); this.load(); }
  nextPage() { this.page.update(p => p + 1); this.load(); }
}