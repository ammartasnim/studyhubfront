
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';

@Component({
  selector: 'app-mention-text',
  standalone: true,
  imports: [CommonModule],
  template: `<span [innerHTML]="rendered"></span>`
})
export class MentionTextComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);

  @Input() text = '';
  rendered: SafeHtml = '';

  ngOnChanges() {
    const escaped = this.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const html = escaped.replace(
      /@([a-zA-Z0-9_]+)/g,
      `<span class="text-indigo-600 font-semibold">@$1</span>`
    );

    this.rendered = this.sanitizer.bypassSecurityTrustHtml(html);
  }
}