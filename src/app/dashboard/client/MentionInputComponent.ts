import {
  Component, Input, Output, EventEmitter,
  inject, signal, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Subject } from 'rxjs';
import { UserSummaryUI } from '../../api/facades/models/friendship.model'; 
import { FriendshipFacadeService } from '../../api/facades/friendship.facade';


@Component({
  selector: 'app-mention-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full">
      <textarea
        #textarea
        [value]="value"
        [placeholder]="placeholder"
        (input)="onInput($event)"
        (keydown)="onKeyDown($event)"
        rows="1"
        class="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none overflow-hidden"
      ></textarea>

      <!-- Dropdown -->
      @if (showDropdown() && friends().length > 0) {
        <div class="absolute z-50 top-full mt-1 left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          @if (loading()) {
            <div class="px-3 py-2 text-xs text-slate-400">Searching...</div>
          }
          @for (friend of friends(); track friend.id; let i = $index) {
            <button
              type="button"
              (mousedown)="selectFriend(friend)"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-indigo-50 transition-colors"
              [class.bg-indigo-50]="i === activeIndex()"
            >
              @if (friend.pfp) {
                <img [src]="'http://localhost:8081/uploads/' + friend.pfp" class="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              } @else {
                <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {{ friend.username?.[0]?.toUpperCase() ?? '?' }}
                </div>
              }
              <div>
                <p class="font-medium text-slate-900 leading-tight">{{ friend.username }}</p>
              </div>
            </button>
          }
        </div>
      }
    </div>
  `
})
export class MentionInputComponent {
  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;
  @Input() value = '';
  @Input() placeholder = '';
  @Output() valueChange = new EventEmitter<string>();

 private readonly facade = inject(FriendshipFacadeService);

  readonly friends      = signal<UserSummaryUI[]>([]);
  readonly loading      = signal(false);
  readonly showDropdown = signal(false);
  readonly activeIndex  = signal(0);

  private mentionStart = -1;
  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
     switchMap(q => {
        this.loading.set(true);
        return this.facade.searchFriends(q);
      })
    ).subscribe({
      next: results => {
        console.log('API returned:', results);
        this.friends.set(results);
        this.loading.set(false);
        this.activeIndex.set(0);
      },
      error: () => { this.loading.set(false); }
    });
  }

  onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    const text = el.value;
    const cursor = el.selectionStart ?? 0;

    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';

    this.valueChange.emit(text);

    if (!text) {
      this.closeDropdown();
      return;
    }

    const textBeforeCursor = text.slice(0, cursor);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      this.mentionStart = cursor - match[0].length;
      this.showDropdown.set(true);
      this.searchSubject.next(match[1]);
    } else {
      this.closeDropdown();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showDropdown()) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update(i => Math.min(i + 1, this.friends().length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update(i => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      const selected = this.friends()[this.activeIndex()];
      if (selected) {
        event.preventDefault();
        this.selectFriend(selected);
      }
    } else if (event.key === 'Escape') {
      this.closeDropdown();
    }
  }

  selectFriend(friend: UserSummaryUI): void {
    const el = this.textarea.nativeElement;
    const text = el.value;
    const cursor = el.selectionStart ?? 0;

    const before   = text.slice(0, this.mentionStart);
    const after    = text.slice(cursor);
    const inserted = `@${friend.username} `;
    const newText  = before + inserted + after;

    this.valueChange.emit(newText);
    this.closeDropdown();

    setTimeout(() => {
      const newCursor = this.mentionStart + inserted.length;
      el.setSelectionRange(newCursor, newCursor);
      el.focus();
    });
  }

  private closeDropdown(): void {
    this.showDropdown.set(false);
    this.friends.set([]);
    this.mentionStart = -1;
  }
}