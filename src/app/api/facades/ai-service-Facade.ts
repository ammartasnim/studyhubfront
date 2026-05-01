// ai-facade.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AiControllerService }    from '../../api/api/aiController.service';
import { ChatRequest }            from '../../api/model/chatRequest';
import { ChatWithContextRequest } from '../../api/model/chatWithContextRequest';
import { ResponseHandlerService } from './response-handler.service'; // 👈 same as community facade

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

function toText(res: any): Observable<string> {
  if (typeof res === 'string') {
    try {
      const parsed = JSON.parse(res);
      return of(parsed.response ?? res); // 👈 unwrap if it's a JSON string
    } catch {
      return of(res);
    }
  }
  if (res instanceof Blob) return new Observable<string>(observer => {
    res.text().then(t => {
      try {
        const parsed = JSON.parse(t);
        observer.next(parsed.response ?? t); // 👈 unwrap blob JSON
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
  private readonly ai             = inject(AiControllerService);
  private readonly responseHandler = inject(ResponseHandlerService); // 👈 added

  chat(message: string): Observable<string> {
     const request = { 
    message, 
    systemPrompt: 'You are a helpful study assistant. Be concise and student-friendly.' 
  } as ChatRequest; 

    return this.ai.chat(request).pipe(
      map(res => {
        this.responseHandler.logResponse('chat', 'POST', res);         // 👈 added
        return res;
      }),
      switchMap(toText),
      catchError(err => this.responseHandler.handleError(err, 'AI chat failed')) // 👈 added
    );
  }

  
}