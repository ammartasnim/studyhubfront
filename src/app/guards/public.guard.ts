import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { UserContextService } from '../user-context.service';

const AUTH_TOKEN_KEY = 'token';

export const publicGuard: CanActivateFn = async () => {
  const userContext = inject(UserContextService);
  const router = inject(Router);

  const token = localStorage.getItem(AUTH_TOKEN_KEY)?.trim();
  console.log('[PublicGuard] Checking token existence:', !!token);
  
  if (!token) {
    console.log('[PublicGuard] No token found, allowing access to public route');
    return true;
  }

  if (!userContext.user()) {
    console.log('[PublicGuard] User not loaded, calling loadMe()');
    await userContext.loadMe();
  }

  if (userContext.user()) {
    const targetRoute = userContext.getDefaultRouteByRole();
    console.log('[PublicGuard] User already logged in, redirecting to:', targetRoute);
    return router.createUrlTree([targetRoute]);
  }

  console.log('[PublicGuard] No user data available, allowing access');
  return true;
};
