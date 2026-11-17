import {
  HttpErrorResponse,
  type HttpEvent,
  type HttpHandlerFn,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { type Observable, retry, throwError, timer } from 'rxjs';

export const MAX_RETRIES: number = 2;
export const RETRY_BASE_DELAY_MS: number = 300;

/** Network failures (status 0) and server errors are worth retrying; 4xx are not. */
export function isRetryable(error: unknown): boolean {
  return error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500);
}

/**
 * Retries failed GET requests with exponential backoff (300 ms, 600 ms).
 * Writes are never retried, because repeating a POST could create duplicates.
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
