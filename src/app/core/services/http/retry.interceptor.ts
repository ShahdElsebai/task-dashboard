import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';

import { Observable, retry, throwError, timer } from 'rxjs';

export const MAX_RETRIES: number = 2;
export const RETRY_BASE_DELAY_MS: number = 300;

/** Network errors (status 0) and server errors (5xx) can succeed on a retry; 4xx can't. */
export function isRetryable(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
}

/**
 * Retries failed GET requests up to `MAX_RETRIES` times with exponential backoff (300 ms, 600 ms).
 *
 * Only GETs are retried: they are safe to repeat, while retrying a POST could create the same
 * task twice.
 */
export const retryInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  if (req.method !== 'GET') return next(req);
  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error: unknown, attempt: number): Observable<number> =>
        isRetryable(error) ? timer(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)) : throwError(() => error),
    })
  );
};
