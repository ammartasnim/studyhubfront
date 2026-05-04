import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserUI } from '../../api/facades/models/user.model';
import { UserFacadeService } from '../../api/facades';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-8">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Users</h2>
    <span class="text-sm text-slate-400">{{ total() }} total</span>
  </div>

  <!-- Search + filters -->
  <div class="flex gap-3 mb-5 flex-wrap">
    <input [(ngModel)]="search" (ngModelChange)="onSearch()"
      placeholder="Search by first name..."
      class="flex-1 min-w-48 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"/>

    <!-- Status filter tabs -->
    <div class="flex gap-2">
      @for (tab of statusTabs; track tab.value) {
        <button (click)="setStatusFilter(tab.value)"
          [class]="statusFilter() === tab.value
            ? 'px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white'
            : 'px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'">
          {{ tab.label }}
        </button>
      }
    </div>
  </div>

  <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-100 bg-slate-50">
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Level</th>
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
          <th class="px-5 py-3.5"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-50">
        @if (loading()) {
          @for (i of skeletons; track i) {
            <tr>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-slate-100 animate-pulse"></div>
                  <div class="flex flex-col gap-1.5">
                    <div class="h-3 w-28 bg-slate-100 rounded animate-pulse"></div>
                    <div class="h-2.5 w-20 bg-slate-100 rounded animate-pulse"></div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5"><div class="h-3 w-36 bg-slate-100 rounded animate-pulse"></div></td>
              <td class="px-5 py-3.5"><div class="h-3 w-10 bg-slate-100 rounded animate-pulse"></div></td>
              <td class="px-5 py-3.5"><div class="h-5 w-14 bg-slate-100 rounded-full animate-pulse"></div></td>
              <td class="px-5 py-3.5"><div class="h-6 w-12 bg-slate-100 rounded-lg animate-pulse ml-auto"></div></td>
            </tr>
          }
        } @else if (users().length === 0) {
          <tr>
            <td colspan="5" class="text-center py-12">
              <p class="text-slate-400 text-sm">No users found.</p>
            </td>
          </tr>
        } @else {
          @for (user of users(); track user.id) {
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  @if (user.pfp) {
                    <img [src]="'http://localhost:8081/uploads/' + user.pfp"
                      class="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
                  } @else {
                    <div class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {{ initials(user) }}
                    </div>
                  }
                  <div>
                    <p class="font-semibold text-slate-800">{{ user.firstName }} {{ user.lastName }}</p>
                    <p class="text-xs text-slate-400">&#64;{{ user.username }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5 text-slate-500">{{ user.email }}</td>
              <td class="px-5 py-3.5 text-slate-500">Lv. {{ user.level }}</td>
              <td class="px-5 py-3.5">
                @if (user.banned) {
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-500 ring-1 ring-red-200">Banned</span>
                } @else {
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">Active</span>
                }
              </td>
              <td class="px-5 py-3.5 text-right">
                @if (user.banned) {
                  <button (click)="toggleBan(user)" [disabled]="banningId() === user.id"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                    {{ banningId() === user.id ? '...' : 'Unban' }}
                  </button>
                } @else {
                  <button (click)="toggleBan(user)" [disabled]="banningId() === user.id"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors">
                    {{ banningId() === user.id ? '...' : 'Ban' }}
                  </button>
                }
              </td>
            </tr>
          }
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
  `
})
export class AdminUsers implements OnInit {
  // Using HttpClient directly — the generated getAllClients signature
  // doesn't map cleanly to the /api/clients query params the backend expects.
  private readonly http = inject(HttpClient);

  readonly users     = signal<UserUI[]>([]);
  readonly total     = signal(0);
  readonly page      = signal(0);
  readonly loading   = signal(false);
  readonly banningId = signal<number | null>(null);
  readonly statusFilter = signal<'ALL' | 'ACTIVE' | 'BANNED'>('ALL');
  readonly size = 10;

  search = '';
  private searchTimer: any;
  readonly skeletons = [1, 2, 3, 4, 5];

  readonly statusTabs = [
    { label: 'All',    value: 'ALL'    as const },
    { label: 'Active', value: 'ACTIVE' as const },
    { label: 'Banned', value: 'BANNED' as const },
  ];

  readonly totalPages = () => Math.ceil(this.total() / this.size);

  ngOnInit() { this.load(); }

  // Remove: private readonly http = inject(HttpClient);
private readonly userFacade = inject(UserFacadeService);

load() {
  this.loading.set(true);
  this.userFacade.getAllRaw({
    firstName: this.search || undefined,
    banned: this.statusFilter() === 'ALL' ? undefined : this.statusFilter() === 'BANNED',
    page: this.page(),
    size: this.size
  }).subscribe({
    next: res => {
      this.users.set(res.items);
      this.total.set(res.totalItems);
      this.loading.set(false);
    },
    error: () => this.loading.set(false)
  });
}

  setStatusFilter(value: 'ALL' | 'ACTIVE' | 'BANNED') {
    this.statusFilter.set(value);
    this.page.set(0);
    this.load();
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(0); this.load(); }, 400);
  }

  prevPage() { this.page.update(p => p - 1); this.load(); }
  nextPage() { this.page.update(p => p + 1); this.load(); }

  // toggleBan(user: UserUI) {
  //   this.banningId.set(user.id);
  //   const endpoint = user.banned
  //     ? `/api/clients/${user.id}/unban`
  //     : `/api/clients/${user.id}/ban`;

  //   this.http.patch(endpoint, {}).subscribe({
  //     next: () => {
  //       this.users.update(list =>
  //         list.map(u => u.id === user.id ? { ...u, banned: !u.banned } : u)
  //       );
  //       this.banningId.set(null);
  //     },
  //     error: err => {
  //       console.error('[AdminUsers] ban/unban error:', err);
  //       this.banningId.set(null);
  //     }
  //   });
  // }
  toggleBan(user: UserUI) {
    this.banningId.set(user.id);
    const action = user.banned
      ? this.userFacade.unban(user.id)
      : this.userFacade.ban(user.id);

    action.subscribe({
      next: () => {
        this.users.update(list => {
          // If we are looking at the BANNED list and we unban them, remove them from the view
          if (this.statusFilter() === 'BANNED' && user.banned) {
            return list.filter(u => u.id !== user.id);
          }
          // If we are looking at the ACTIVE list and we ban them, remove them from the view
          if (this.statusFilter() === 'ACTIVE' && !user.banned) {
            return list.filter(u => u.id !== user.id);
          }
          // Otherwise (on the 'ALL' tab), just update their status inline
          return list.map(u => u.id === user.id ? { ...u, banned: !u.banned } : u);
        });

        // Adjust total count if we removed an item from the current view
        if (this.statusFilter() !== 'ALL') {
          this.total.update(t => Math.max(0, t - 1));
        }

        this.banningId.set(null);
      },
      error: () => this.banningId.set(null)
    });
  }

  initials(user: UserUI): string {
    const f = user.firstName?.[0] ?? '';
    const l = user.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || user.username?.substring(0, 2).toUpperCase() || '?';
  }

  // Map raw backend DTO to UserUI without depending on the facade
  private mapToUI(dto: any): UserUI {
    return {
      id: dto.id ?? 0,
      username: dto.username ?? '',
      email: dto.email ?? '',
      firstName: dto.firstName ?? '',
      lastName: dto.lastName ?? '',
      pfp: dto.pfp ?? undefined,
      phone: dto.phone ?? undefined,
      xpPts: dto.xpPts ?? 0,
      level: dto.level ?? 1,
      banned: dto.banned ?? false,
      role: dto.role ?? 'Client',
      badges: (dto.badges ?? []).map((b: any) => ({
        id: b.id,
        type: b.type,
        userId: b.userId
      }))
    };
  }
}