import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';

export const authGuard: CanActivateFn = () => {
  const token = inject(Auth).getToken();
  return !!token || inject(Router).createUrlTree(['/login']);
};
