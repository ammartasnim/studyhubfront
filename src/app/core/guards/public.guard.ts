import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { UserContextService } from '../../services/user-context.service';

const AUTH_TOKEN_KEY = 'token';

export const publicGuard: CanActivateFn = async () => {
  const userContext = inject(UserContextService);
  const router = inject(Router);

  const token = localStorage.getItem(AUTH_TOKEN_KEY)?.trim();
  
  if (!token) {
    return true;
  }

  if (!userContext.user()) {
    await userContext.loadMe();
  }

  if (userContext.user()) {
    const targetRoute = userContext.getDefaultRouteByRole();
    return router.createUrlTree([targetRoute]);
  }

  return true;
};
