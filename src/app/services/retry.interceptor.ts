import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, timer } from 'rxjs';

const TRANSIENT = new Set([0, 502, 503, 504]);

/**
 * Retries a failed GET once after a short pause when the failure looks
 * transient (network drop, proxy restart during a Railway deploy).
 * Writes are never retried: repeating a POST could duplicate a record.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET' || !req.url.startsWith('/api/')) return next(req);
  return next(req).pipe(
    retry({
      count: 1,
      delay: error => {
        if (error instanceof HttpErrorResponse && TRANSIENT.has(error.status)) return timer(600);
        throw error;
      },
    }),
  );
};
