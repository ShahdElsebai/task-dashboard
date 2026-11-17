import { type ErrorHandler, Injector, Service, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from './notification.service';

/**
 * App-wide "error boundary".
 *
 * Angular has no per-component error boundaries like React. Uncaught errors
 * from templates, effects, event handlers and promises all land here instead.
 * We log them and show a toast, so the app keeps running rather than failing silently.
 *
 * HTTP errors are skipped: errorInterceptor already reported those.
 */
@Service({ autoProvided: false })
export class GlobalErrorHandler implements ErrorHandler {
  // Resolved lazily: the toast service isn't ready while the app is bootstrapping.
  private readonly injector: Injector = inject(Injector);

  handleError(error: unknown): void {
    console.error(error);
    if (error instanceof HttpErrorResponse) return;
    try {
      this.injector.get(NotificationService).error('errors.unexpected');
    } catch {
      /* the toast itself failed; the console log above is enough */
    }
  }
}
