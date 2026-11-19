import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, inject, Injector, Service } from '@angular/core';

import { NotificationService } from './notification.service';

/**
 * The app's error boundary: logs any uncaught error and shows a generic toast.
 *
 * HTTP errors are skipped because the interceptors and pages already report them. The
 * notification service is resolved lazily so a failure while creating it can't take the
 * handler down too.
 */
@Service({ autoProvided: false })
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector: Injector = inject(Injector);

  handleError(error: unknown): void {
    console.error(error);
    if (error instanceof HttpErrorResponse) return;
    try {
      this.injector.get(NotificationService).error('errors.unexpected');
    } catch {}
  }
}
