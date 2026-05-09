import {
  Component, Input, Output, EventEmitter, signal, inject, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AiFacadeService } from '../../api/facades/ai.facade';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  typing?: boolean;
}

interface MessageSegment {
  type: 'text' | 'code';
  content: string;
  language?: string;
  open?: boolean; 
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="fixed bottom-0 left-1/2 -translate-x-1/2 z-50
             w-[min(680px,95vw)] h-[72vh] max-h-[680px]
             bg-white rounded-t-2xl shadow-2xl flex flex-col
             transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
      [class.translate-y-full]="!open"
      [class.translate-y-0]="open"
    >
      <!-- Drag handle -->
      <div class="w-9 h-1 bg-slate-200 rounded-full mx-auto mt-3 flex-shrink-0"></div>

      <!-- Header -->
      <div class="flex items-center justify-between px-5 pt-3 pb-3 border-b border-slate-100 flex-shrink-0">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <svg class="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l1.88 5.76a1 1 0 00.95.69H21l-5.12 3.72a1 1 0 00-.36 1.12L17.4 20l-5.12-3.72a1 1 0 00-1.16 0L6 20l1.88-5.71a1 1 0 00-.36-1.12L2 9.45h6.17a1 1 0 00.95-.69L12 3z"/>
          </svg>
          AI Assistant
          <span class="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full
                       bg-gradient-to-r from-indigo-500 to-violet-500 text-white">Beta</span>
        </h3>
        <button (click)="closePanel.emit()"
                class="w-7 h-7 flex items-center justify-center rounded-full
                       bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Empty state -->
      @if (messages().length === 0 && !loading()) {
        <div class="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div class="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center">
            <svg class="w-5 h-5 text-violet-500" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3l1.88 5.76a1 1 0 00.95.69H21l-5.12 3.72a1 1 0 00-.36 1.12L17.4 20l-5.12-3.72a1 1 0 00-1.16 0L6 20l1.88-5.71a1 1 0 00-.36-1.12L2 9.45h6.17a1 1 0 00.95-.69L12 3z"/>
            </svg>
          </div>
          <p class="text-sm">Ask me anything about your studies!</p>
        </div>
      }

      <!-- Messages -->
      @if (messages().length > 0 || loading()) {
        <div #msgContainer class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

          @for (msg of messages(); track $index) {

            <!-- User bubble -->
            @if (msg.role === 'user') {
              <div class="flex justify-end">
                <div class="max-w-[78%] px-3.5 py-2.5 rounded-2xl rounded-br-sm
                            text-sm leading-relaxed
                            bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                  {{ msg.text }}
                </div>
              </div>
            }

            <!-- Assistant -->
            @if (msg.role === 'assistant') {
              <div class="flex flex-col gap-1 max-w-[90%]">
                <span class="flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 mb-0.5">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3l1.88 5.76a1 1 0 00.95.69H21l-5.12 3.72a1 1 0 00-.36 1.12L17.4 20l-5.12-3.72a1 1 0 00-1.16 0L6 20l1.88-5.71a1 1 0 00-.36-1.12L2 9.45h6.17a1 1 0 00.95-.69L12 3z"/>
                  </svg>
                  AI Assistant
                </span>

                @for (seg of parseMessage(msg.text); track $index) {

                  <!-- Plain text segment -->
                  @if (seg.type === 'text') {
                    <p class="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap m-0">
                      {{ seg.content }}<span
                        class="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle animate-pulse"
                        [class.hidden]="!msg.typing || !isLastSegment(msg.text, $index)"
                      ></span>
                    </p>
                  }

                  <!-- Code block segment -->
                  @if (seg.type === 'code') {
                    <div class="rounded-xl overflow-hidden border border-slate-200 my-1 text-sm">
                      <!-- Header -->
                      <div class="flex items-center justify-between px-3 py-2
                                  bg-slate-100 border-b border-slate-200">
                        <span class="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <!-- Triangle -->
                          <span class="w-0 h-0
                                       border-t-[5px] border-t-transparent
                                       border-b-[5px] border-b-transparent
                                       border-l-[8px]"
                                [class.border-l-indigo-400]="seg.open"
                                [class.animate-pulse]="seg.open"
                                [class.border-l-indigo-500]="!seg.open">
                          </span>
                          {{ seg.language || 'code' }}
                          <!-- ✅ "writing…" label while block is still open -->
                          @if (seg.open) {
                            <span class="text-[10px] text-indigo-300 font-normal">writing…</span>
                          }
                        </span>
                        <!-- Copy only available once block is closed -->
                        @if (!seg.open) {
                          <button
                            (click)="copyCode(seg.content, $index)"
                            class="text-xs px-2.5 py-1 rounded-md border border-slate-300
                                   text-slate-500 hover:bg-slate-200 transition-colors"
                            [class.text-green-600]="copiedIndex() === $index"
                            [class.border-green-400]="copiedIndex() === $index"
                          >
                            {{ copiedIndex() === $index ? 'Copied!' : 'Copy' }}
                          </button>
                        }
                      </div>
                      <!-- Code body -->
                      <pre class="m-0 px-4 py-3 bg-slate-50 overflow-x-auto
                                  text-[13px] leading-relaxed text-slate-800 font-mono"
                      >{{ seg.content }}<span
                          class="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle animate-pulse"
                          [class.hidden]="!msg.typing || !seg.open"
                        ></span></pre>
                    </div>
                  }
                }
              </div>
            }
          }

          <!-- Thinking dots -->
          @if (loading()) {
            <div class="flex flex-col gap-1">
              <span class="flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 mb-0.5">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3l1.88 5.76a1 1 0 00.95.69H21l-5.12 3.72a1 1 0 00-.36 1.12L17.4 20l-5.12-3.72a1 1 0 00-1.16 0L6 20l1.88-5.71a1 1 0 00-.36-1.12L2 9.45h6.17a1 1 0 00.95-.69L12 3z"/>
                </svg>
                AI Assistant
              </span>
              <div class="flex gap-1.5 py-1">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:0ms]"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:150ms]"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:300ms]"></span>
              </div>
            </div>
          }

          <!-- Error -->
          @if (error()) {
            <div class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                        bg-red-50 border border-red-200 text-red-600 text-sm">
              <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ error() }}
            </div>
          }
        </div>
      }

      <!-- Input row -->
      <div class="flex items-end gap-2.5 px-4 py-3.5 border-t border-slate-100 flex-shrink-0">
        <textarea
          [(ngModel)]="inputText"
          placeholder="Ask something…"
          rows="1"
          (keydown.enter)="onEnter($event)"
          (input)="autoResize($event)"
          class="flex-1 resize-none border-[1.5px] border-slate-200 rounded-xl
                 px-3.5 py-2.5 text-sm leading-relaxed text-slate-800
                 placeholder:text-slate-400 max-h-[120px] outline-none
                 focus:border-indigo-400 transition-colors font-[inherit]"
        ></textarea>

        <!-- ✅ Stop button — shown while typing is in progress -->
        @if (typing()) {
          <button
            (click)="stopTyping()"
            class="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center
                   border-2 border-red-400 text-red-400
                   hover:bg-red-50 transition-all duration-150"
            title="Stop generating"
          >
            <!-- Square stop icon -->
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
            </svg>
          </button>
        }

        <!-- Send button — hidden while typing -->
        @if (!typing()) {
          <button
            (click)="sendMessage()"
            [disabled]="!inputText.trim() || loading()"
            class="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center
                   bg-gradient-to-br from-indigo-500 to-violet-500 text-white
                   transition-all duration-150
                   hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        }
      </div>
    </div>
  `
})
export class AiAssistant {
  @Input() open = false;
  @Output() closePanel = new EventEmitter<void>();
  @ViewChild('msgContainer') private msgContainer!: ElementRef<HTMLDivElement>;

  private readonly aiFacade = inject(AiFacadeService);

  inputText = '';
  readonly messages    = signal<Message[]>([]);
  readonly loading     = signal(false);
  readonly typing      = signal(false);  
  readonly error       = signal<string | null>(null);
  readonly copiedIndex = signal<number | null>(null);

  private stopRequested = false;

  onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) { ke.preventDefault(); this.sendMessage(); }
  }

  autoResize(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  stopTyping(): void {
    this.stopRequested = true;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.msgContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }
  parseMessage(text: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    const closedFence = /```(\w*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = closedFence.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      segments.push({ type: 'code', language: match[1] || 'code', content: match[2].trimEnd(), open: false });
      lastIndex = match.index + match[0].length;
    }

    const remaining = text.slice(lastIndex);

    // ✅ Check if there's an unclosed opening fence in what's left
    const openFence = /```(\w*)\n?([\s\S]*)$/;
    const openMatch = remaining.match(openFence);

    if (openMatch) {
      // Text before the opening fence
      const before = remaining.slice(0, remaining.indexOf('```'));
      if (before) segments.push({ type: 'text', content: before });
      // The in-progress code block — marked open: true
      segments.push({ type: 'code', language: openMatch[1] || 'code', content: openMatch[2], open: true });
    } else if (remaining) {
      segments.push({ type: 'text', content: remaining });
    }

    return segments;
  }

  isLastSegment(text: string, segIndex: number): boolean {
    const segs = this.parseMessage(text);
    // Last segment is text type — cursor goes there
    const lastText = [...segs].reverse().find(s => s.type === 'text');
    return segs[segIndex] === lastText;
  }

  copyCode(content: string, index: number): void {
    navigator.clipboard.writeText(content).then(() => {
      this.copiedIndex.set(index);
      setTimeout(() => this.copiedIndex.set(null), 2000);
    });
  }

  private async typeMessage(fullText: string): Promise<void> {
    this.stopRequested = false;
    this.typing.set(true);
    this.messages.update(m => [...m, { role: 'assistant', text: '', typing: true }]);

    for (let i = 0; i < fullText.length; i++) {
      // ✅ Check stop flag each character
      if (this.stopRequested) break;

      await new Promise(r => setTimeout(r, 13));
      this.messages.update(msgs => {
        const updated = [...msgs];
        const last = { ...updated[updated.length - 1] };
        last.text = fullText.slice(0, i + 1);
        updated[updated.length - 1] = last;
        return updated;
      });
      this.scrollToBottom();
    }

    this.messages.update(msgs => {
      const updated = [...msgs];
      updated[updated.length - 1] = { ...updated[updated.length - 1], typing: false };
      return updated;
    });
    this.typing.set(false);
  }

  async sendMessage(): Promise<void> {
    const text = this.inputText.trim();
    if (!text || this.loading()) return;

    this.inputText = '';
    this.error.set(null);
    this.messages.update(m => [...m, { role: 'user', text }]);
    this.loading.set(true);
    this.scrollToBottom();

    try {
      const reply = await firstValueFrom(this.aiFacade.chat(text));
      this.loading.set(false);
      await this.typeMessage(reply);
    } catch (err: any) {
      const msg = err?.error?.message ?? err?.message ?? 'Something went wrong.';
      console.error('AI chat error:', err);
      this.error.set(msg);
    } finally {
      this.loading.set(false);
      this.typing.set(false);
    }
  }
}