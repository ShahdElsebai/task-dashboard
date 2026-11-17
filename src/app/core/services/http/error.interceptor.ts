import type { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { type Observable, catchError, throwError } from 'rxjs';

import { NotificationService } from '../notification.service';
import { type AppError, toAppError } from './app-error';
import { SKIP_ERROR_TOAST } from './http-context.tokens';

/**
 * Shows one toast per failed request (after retries are exhausted) and
 * rethrows the original error so callers can still roll back or show inline state.
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const notifications: NotificationService = inject(NotificationService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (!req.context.get(SKIP_ERROR_TOAST)) {
        const appError: AppError = toAppError(error);
        notifications.error(appError.messageKey);
      }
      return throwError(() => error);
    })
  );
};
