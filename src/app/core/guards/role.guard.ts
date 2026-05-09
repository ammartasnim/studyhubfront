import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserContextService } from '../../services/user-context.service';

const AUTH_TOKEN_KEY = 'token';

export const roleGuard = (roles: string[]): CanActivateFn => {
  return async () => {
    const userContext = inject(UserContextService);
    const router = inject(Router);

    const token = localStorage.getItem(AUTH_TOKEN_KEY)?.trim();
    if (!token) {
      return router.createUrlTree(['/auth/login']);
    }

    if (!userContext.user()) {
      await userContext.loadMe();
    }

    const user = userContext.user();
    if (!user) {
      return router.createUrlTree(['/auth/login']);
    }

    if (!user.role || !roles.includes(user.role)) {
      return router.createUrlTree(['/dashboard']);
    }

    return true;
  };
};
