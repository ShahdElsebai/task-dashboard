import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';

import { catchError, Observable, throwError } from 'rxjs';

import { AppError } from '../../models';
import { NotificationService } from '../notification.service';
import { toAppError } from './app-error';
import { SKIP_ERROR_TOAST } from './http-context.tokens';

/**
 * Shows a toast when a write (POST, PATCH, DELETE) fails, unless the request opts out with
 * `SKIP_ERROR_TOAST`.
 *
 * Failed GETs don't toast: the page that made them shows an error state with a Retry button,
 * and a toast on top of it would say the same thing twice.
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const notifications: NotificationService = inject(NotificationService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (req.method !== 'GET' && !req.context.get(SKIP_ERROR_TOAST)) {
        const appError: AppError = toAppError(error);
        notifications.error(appError.messageKey);
      }
      return throwError(() => error);
    })
  );
};
