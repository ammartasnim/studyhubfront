import { Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendshipFacadeService } from '../../api/facades/friendship.facade';

@Component({
  selector: 'app-mention-input',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="relative w-full">
  <textarea
    #textareaRef
    [value]="value"
    (input)="onInput($event)"
    (keydown)="onKeydown($event)"
    [placeholder]="placeholder"
    [rows]="rows"
    class="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
  </textarea>

  @if (showDropdown() && filtered().length > 0) {
    <div class="absolute z-50 left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
      @for (friend of filtered(); track friend.id; let i = $index) {
        <button
          (mousedown)="selectFriend(friend, $event)"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors text-left"
          [class.bg-indigo-50]="i === activeIndex()">
          @if (friend.pfp) {
            <img [src]="'http://localhost:8081/uploads/' + friend.pfp"
              class="w-7 h-7 rounded-full object-cover flex-shrink-0"/>
          } @else {
            <div class="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {{ (friend.firstName?.[0] ?? '') + (friend.lastName?.[0] ?? '') }}
            </div>
          }
          <div>
            <p class="font-medium text-slate-800">{{ friend.firstName }} {{ friend.lastName }}</p>
            <p class="text-xs text-slate-400">&#64;{{ friend.username }}</p>
          </div>
        </button>
      }
    </div>
  }
</div>
  `
})
export class MentionInputComponent implements OnInit {
  private readonly friendshipFacade = inject(FriendshipFacadeService);

  @Input() value = '';
  @Input() placeholder = 'Write a comment...';
  @Input() rows = 2;
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('textareaRef') textareaRef!: ElementRef<HTMLTextAreaElement>;

  readonly friends      = signal<any[]>([]);
  readonly filtered     = signal<any[]>([]);
  readonly showDropdown = signal(false);
  readonly activeIndex  = signal(0);

  private mentionStart = -1;
  private mentionQuery = '';

  ngOnInit() {
    this.friendshipFacade.searchFriends('').subscribe({
      next: res => this.friends.set(Array.isArray(res) ? res : []),
      error: () => {}
    });
  }

  onInput(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    const text = el.value;
    const cursor = el.selectionStart ?? 0;

    this.valueChange.emit(text);

    const slice = text.slice(0, cursor);
    const atIdx = slice.lastIndexOf('@');

    if (atIdx !== -1) {
      const between = slice.slice(atIdx + 1);
      if (!between.includes(' ')) {
        this.mentionStart = atIdx;
        this.mentionQuery = between.toLowerCase();
        const results = this.friends().filter(f =>
          f.username?.toLowerCase().includes(this.mentionQuery) ||
          f.firstName?.toLowerCase().includes(this.mentionQuery) ||
          f.lastName?.toLowerCase().includes(this.mentionQuery)
        );
        this.filtered.set(results);
        this.showDropdown.set(results.length > 0);
        this.activeIndex.set(0);
        return;
      }
    }

    this.showDropdown.set(false);
    this.mentionStart = -1;
  }

  onKeydown(event: KeyboardEvent) {
    if (!this.showDropdown()) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update(i => Math.min(i + 1, this.filtered().length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update(i => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      const friend = this.filtered()[this.activeIndex()];
      if (friend) { event.preventDefault(); this.insertMention(friend); }
    } else if (event.key === 'Escape') {
      this.showDropdown.set(false);
    }
  }

  selectFriend(friend: any, event: MouseEvent) {
    event.preventDefault();
    this.insertMention(friend);
  }

  private insertMention(friend: any) {
    const el = this.textareaRef.nativeElement;
    const text = el.value;
    const before = text.slice(0, this.mentionStart);
    const after = text.slice(this.mentionStart + 1 + this.mentionQuery.length);
    const inserted = `@${friend.username} `;
    const newText = before + inserted + after;

    this.valueChange.emit(newText);

    setTimeout(() => {
      const pos = before.length + inserted.length;
      el.setSelectionRange(pos, pos);
      el.focus();
    });

    this.showDropdown.set(false);
    this.mentionStart = -1;
  }
}