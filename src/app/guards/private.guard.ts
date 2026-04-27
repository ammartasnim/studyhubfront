import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { UserContextService } from '../user-context.service';

const AUTH_TOKEN_KEY = 'token';

export const privateGuard: CanActivateFn = async () => {
  const userContext = inject(UserContextService);
  const router = inject(Router);

  const token = localStorage.getItem(AUTH_TOKEN_KEY)?.trim();
  if (!token) {
    return router.createUrlTree(['/auth/login']);
  }

  if (!userContext.user()) {
    await userContext.loadMe();
  }

  if (!userContext.user()) {
    return router.createUrlTree(['/auth/login']);
  }

  return true;
};
