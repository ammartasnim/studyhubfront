import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-8">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Comments</h2>
    <span class="text-sm text-slate-400">{{ total() }} total</span>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-100 bg-slate-50">
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Content</th>
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Author</th>
          <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Post</th>
          <th class="px-5 py-3.5"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-50">
        @if (loading()) {
          <tr><td colspan="4" class="text-center py-10 text-slate-400 text-sm">Loading...</td></tr>
        } @else if (comments().length === 0) {
          <tr><td colspan="4" class="text-center py-10 text-slate-400 text-sm">No comments found.</td></tr>
        }
        @for (c of comments(); track c.id) {
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-5 py-3.5 text-slate-700 max-w-sm">
              <p class="line-clamp-2">{{ c.content }}</p>
            </td>
            <td class="px-5 py-3.5 text-slate-500 whitespace-nowrap">
              {{ c.userFirstName }} {{ c.userLastName }}
              <span class="text-slate-300 ml-1">@{{ c.userUsername }}</span>
            </td>
            <td class="px-5 py-3.5 text-slate-500 max-w-xs truncate">
              {{ c.postTitle ?? '—' }}
            </td>
            <td class="px-5 py-3.5 text-right">
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
          <h3 class="font-bold text-slate-900">Delete Comment?</h3>
          <p class="text-sm text-slate-500 mt-0.5 line-clamp-1">{{ deleteTarget()?.content }}</p>
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
export class AdminComments implements OnInit {
  private readonly http = inject(HttpClient);

  readonly comments     = signal<any[]>([]);
  readonly total        = signal(0);
  readonly page         = signal(0);
  readonly loading      = signal(false);
  readonly deleteTarget = signal<any | null>(null);

  readonly size = 10;
  readonly totalPages = () => Math.ceil(this.total() / this.size);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any>('/api/comments', {
      params: { page: this.page(), size: this.size }
    }).subscribe({
      next: res => {
        this.comments.set(res.content ?? []);
        this.total.set(res.totalElements ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  confirmDelete(c: any) { this.deleteTarget.set(c); }
  cancelDelete()        { this.deleteTarget.set(null); }

  executeDelete() {
    const target = this.deleteTarget();
    if (!target) return;
    this.http.delete(`/api/comments/${target.id}`).subscribe({
      next: () => {
        this.comments.update(list => list.filter(c => c.id !== target.id));
        this.total.update(t => t - 1);
        this.deleteTarget.set(null);
      }
    });
  }

  prevPage() { this.page.update(p => p - 1); this.load(); }
  nextPage() { this.page.update(p => p + 1); this.load(); }
}