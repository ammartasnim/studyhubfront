import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserFacadeService } from '../../api/facades/user.facade';
import { UserUI } from '../../api/facades/models/user.model';

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

  <div class="flex gap-3 mb-6">
    <input [(ngModel)]="search" (ngModelChange)="onSearch()"
      placeholder="Search by first name..."
      class="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"/>
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
          <tr><td colspan="5" class="text-center py-10 text-slate-400 text-sm">Loading...</td></tr>
        } @else if (users().length === 0) {
          <tr><td colspan="5" class="text-center py-10 text-slate-400 text-sm">No users found.</td></tr>
        }
        @for (user of users(); track user.id) {
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {{ initials(user) }}
                </div>
                <div>
                  <p class="font-semibold text-slate-800">{{ user.firstName }} {{ user.lastName }}</p>
                  <p class="text-xs text-slate-400">&#64;{{ user?.username }}</p>
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
                <button (click)="toggleBan(user)"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                  Unban
                </button>
              } @else {
                <button (click)="toggleBan(user)"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                  Ban
                </button>
              }
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
  `
})
export class AdminUsers implements OnInit {
  private readonly userFacade = inject(UserFacadeService);

  readonly users   = signal<UserUI[]>([]);
  readonly total   = signal(0);
  readonly page    = signal(0);
  readonly loading = signal(false);
  readonly size    = 10;

  search = '';
  private searchTimer: any;

  readonly totalPages = () => Math.ceil(this.total() / this.size);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.userFacade.getAll({
      firstName: this.search || undefined,
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

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(0); this.load(); }, 400);
  }

  prevPage() { this.page.update(p => p - 1); this.load(); }
  nextPage() { this.page.update(p => p + 1); this.load(); }

  toggleBan(user: UserUI) {
    const action = user.banned
      ? this.userFacade.unban(user.id)
      : this.userFacade.ban(user.id);

    action.subscribe({
      next: () => this.users.update(list =>
        list.map(u => u.id === user.id ? { ...u, banned: !u.banned } : u)
      )
    });
  }

  initials(user: UserUI): string {
    const f = user.firstName?.[0] ?? '';
    const l = user.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || user?.username?.substring(0, 2).toUpperCase() || '';
  }
}