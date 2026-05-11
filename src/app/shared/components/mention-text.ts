import { Component, Input, OnChanges, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-mention-text',
  standalone: true,
  imports: [CommonModule],
  template: `<span [innerHTML]="rendered"></span>`
})
export class MentionTextComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  @Input() text = '';
  rendered: SafeHtml = '';

  ngOnChanges() {
    const escaped = (this.text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const html = escaped.replace(
      /@([a-zA-Z0-9_]+)/g,
      `<span data-mention="$1" class="text-indigo-600 font-semibold cursor-pointer hover:underline">@$1</span>`
    );
    this.rendered = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  @HostListener('click', ['$event'])
  async onHostClick(event: MouseEvent): Promise<void> {
    const el = event.target as HTMLElement;
    const username = el.dataset['mention'];
    if (!username) return;
    event.stopPropagation();
    try {
      const result: any = await firstValueFrom(
        this.http.get(`${environment.apiBaseUrl}/api/clients/search`, {
          params: { username, size: '1' }
        })
      );
      const user = (result.content ?? [])[0];
      if (user?.id) {
        this.router.navigate(['/dashboard/client/profile', user.id]);
      }
    } catch {
      // username not found
    }
  }
}
