import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { Auth } from './auth';

/**
 * Adds the bearer token to same-origin API calls and ends the session when the
 * API answers 401 (expired, revoked or invalid token).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const isApi = req.url.startsWith('/api/');
  const token = isApi ? auth.getToken() : null;
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      const isLogin = req.url.endsWith('/auth/login');
      if (isApi && !isLogin && error instanceof HttpErrorResponse && error.status === 401 && token) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { sesion: 'expirada' } });
      }
      return throwError(() => error);
    }),
  );
};
