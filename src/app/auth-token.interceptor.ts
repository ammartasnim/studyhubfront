import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';

const AUTH_TOKEN_KEY = 'token';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!token || req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register')) {
    return next(req);
  }

  const authorizedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authorizedRequest).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse && req.url.includes('/api/clients/me')) {
          console.log('[Interceptor] /api/clients/me response:', {
            status: event.status,
            contentType: event.headers.get('content-type'),
            body: event.body,
            bodyType: event.body?.constructor?.name
          });
        }
      }
    })
  );
};
