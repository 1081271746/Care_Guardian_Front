import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from './auth';

/** Private routes: require a non-expired token and remember where to return. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  if (auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/login'], {
    queryParams: state.url && state.url !== '/' ? { volver: state.url } : {},
  });
};

/** Login page: a signed-in caregiver goes straight to the panel. */
export const guestGuard: CanActivateFn = () => {
  return inject(Auth).isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};
