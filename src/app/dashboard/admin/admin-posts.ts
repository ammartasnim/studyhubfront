import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostFacadeService } from '../../api/facades/post.facade';
import { PostUI } from '../../api/facades/models/post.model';

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-8">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Posts</h2>
    <span class="text-sm text-slate-400">{{ total() }} total</span>
  </div>

  <!-- Filter tabs -->
  <div class="flex gap-2 mb-5">
    @for (tab of tabs; track tab.value) {
      <button (click)="setFilter(tab.value)"
        [class]="activeFilter() === tab.value
          ? 'px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white'
          : 'px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'">
        {{ tab.label }}
      </button>
    }
  </div>

  <!-- Table -->
  <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-100 bg-slate-50">
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Title</th>
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Author</th>
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Community</th>
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
          <th class="px-5 py-3.5"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-50">
        @if (loading()) {
          <tr><td colspan="5" class="text-center py-10 text-slate-400 text-sm">Loading...</td></tr>
        } @else if (posts().length === 0) {
          <tr><td colspan="5" class="text-center py-10 text-slate-400 text-sm">No posts found.</td></tr>
        }
        @for (post of posts(); track post.id) {
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-5 py-3.5 font-semibold text-slate-800 max-w-xs truncate">{{ post.title }}</td>
            <td class="px-5 py-3.5 text-slate-500">{{ post.authorFullName }}</td>
            <td class="px-5 py-3.5 text-slate-500">
              @if (post.communityTitle && post.communityTitle !== 'General') {
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
                  c/{{ post.communityTitle }}
                </span>
              } @else {
                <span class="text-slate-300">—</span>
              }
            </td>
            <td class="px-5 py-3.5">
              <span [class]="statusClass(post.status)">{{ post.status || 'PENDING' }}</span>
            </td>
            <td class="px-5 py-3.5">
              <div class="flex items-center justify-end gap-2">
                @if (post.status !== 'APPROVED') {
                  <button (click)="approve(post)"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                    Approve
                  </button>
                }
                @if (post.status !== 'FLAGGED') {
                  <button (click)="flag(post)"
                    class="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors">
                    Flag
                  </button>
                }
                <button (click)="confirmDelete(post)"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>

  <!-- Pagination -->
  <div class="flex items-center justify-between mt-4">
    <span class="text-xs text-slate-400">Page {{ page() + 1 }} of {{ totalPages() }}</span>
    <div class="flex gap-2">
      <button (click)="prevPage()" [disabled]="page() === 0"
        class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
        Previous
      </button>
      <button (click)="nextPage()" [disabled]="page() + 1 >= totalPages()"
        class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
        Next
      </button>
    </div>
  </div>
</div>

<!-- Delete confirm modal -->
@if (deleteTarget()) {
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
      <div class="flex items-center gap-4 mb-4">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div>
          <h3 class="font-bold text-slate-900">Delete Post?</h3>
          <p class="text-sm text-slate-500 mt-0.5 truncate max-w-xs">{{ deleteTarget()?.title }}</p>
        </div>
      </div>
      <p class="text-sm text-slate-600 mb-6">This action cannot be undone.</p>
      <div class="flex gap-3">
        <button (click)="cancelDelete()" class="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50">Cancel</button>
        <button (click)="executeDelete()" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Delete</button>
      </div>
    </div>
  </div>
}
  `
})
export class AdminPosts implements OnInit {
  private readonly postFacade = inject(PostFacadeService);

  readonly posts      = signal<PostUI[]>([]);
  readonly total      = signal(0);
  readonly page       = signal(0);
  readonly loading    = signal(false);
  readonly activeFilter = signal<string>('ALL');
  readonly deleteTarget = signal<PostUI | null>(null);

  readonly size = 10;
  readonly tabs = [
    { label: 'All',      value: 'ALL' },
    { label: 'Pending',  value: 'PENDING' },
    { label: 'Flagged',  value: 'FLAGGED' },
    { label: 'Approved', value: 'APPROVED' },
  ];

  readonly totalPages = () => Math.ceil(this.total() / this.size);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.postFacade.getAll({ page: this.page(), size: this.size }).subscribe({
      next: res => {
        // Filter client-side since your backend getAll doesn't take a status filter
        const filter = this.activeFilter();
        const items = filter === 'ALL' ? res.items : res.items.filter(p => p.status === filter);
        this.posts.set(items);
        this.total.set(res.totalItems);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setFilter(value: string) {
    this.activeFilter.set(value);
    this.page.set(0);
    this.load();
  }

  approve(post: PostUI) {
    this.postFacade.approve(post.id).subscribe({
      next: updated => this.posts.update(list => list.map(p => p.id === post.id ? updated : p))
    });
  }

  flag(post: PostUI) {
    this.postFacade.flag(post.id).subscribe({
      next: updated => this.posts.update(list => list.map(p => p.id === post.id ? updated : p))
    });
  }

  confirmDelete(post: PostUI) { this.deleteTarget.set(post); }
  cancelDelete()              { this.deleteTarget.set(null); }

  executeDelete() {
    const target = this.deleteTarget();
    if (!target) return;
    this.postFacade.delete(target.id).subscribe({
      next: () => {
        this.posts.update(list => list.filter(p => p.id !== target.id));
        this.total.update(t => t - 1);
        this.deleteTarget.set(null);
      }
    });
  }

  prevPage() { this.page.update(p => p - 1); this.load(); }
  nextPage() { this.page.update(p => p + 1); this.load(); }

  statusClass(status: string): string {
    const base = 'px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ';
    switch (status) {
      case 'APPROVED': return base + 'bg-emerald-50 text-emerald-600 ring-emerald-200';
      case 'FLAGGED':  return base + 'bg-amber-50 text-amber-600 ring-amber-200';
      default:         return base + 'bg-slate-50 text-slate-500 ring-slate-200';
    }
  }
}