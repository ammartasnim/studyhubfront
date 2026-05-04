// ai-facade.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AiControllerService }    from '../../api/api/aiController.service';
import { ChatRequest }            from '../../api/model/chatRequest';
import { ChatWithContextRequest } from '../../api/model/chatWithContextRequest';
import { formatApiError } from './models/api-error.model';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

function toText(res: any): Observable<string> {
  if (typeof res === 'string') {
    try {
      const parsed = JSON.parse(res);
      return of(parsed.response ?? res);
    } catch {
      return of(res);
    }
  }
  if (res instanceof Blob) return new Observable<string>(observer => {
    res.text().then(t => {
      try {
        const parsed = JSON.parse(t);
        observer.next(parsed.response ?? t);
      } catch {
        observer.next(t);
      }
      observer.complete();
    }).catch(e => observer.error(e));
  });
  if (res?.response) return of(String(res.response)); 
  return of(JSON.stringify(res));
}

@Injectable({ providedIn: 'root' })
export class AiFacadeService {
  private readonly ai = inject(AiControllerService);

  chat(message: string): Observable<string> {
     const request = { 
    message, 
    systemPrompt: 'You are a helpful study assistant. Be concise and student-friendly.' 
  } as ChatRequest; 

    return this.ai.chat(request).pipe(
      switchMap(toText),
      catchError(err => this.handleError(err, 'AI chat failed'))
    );
  }

  private handleError(error: any, message: string): Observable<never> {
    const formatted = formatApiError(error, message);
    console.groupCollapsed(`[AiFacade] ${formatted}`);
    console.error('Operation:', message);
    console.error('Full Error:', error);
    if (error?.error) console.error('Backend Response:', error.error);
    console.groupEnd();
    return throwError(() => new Error(formatted));
  }
}