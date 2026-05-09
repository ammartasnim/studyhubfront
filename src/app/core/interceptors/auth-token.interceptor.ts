import { HttpInterceptorFn } from '@angular/common/http';

const AUTH_TOKEN_KEY = 'token';

// Attaches the stored JWT as a Bearer token to every outgoing request,
// except login and register which are public endpoints.
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

  return next(authorizedRequest);
};
