import { ErrorHandler, Injector, Service, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from './notification.service';

@Service({ autoProvided: false })
export class GlobalErrorHandler implements ErrorHandler {
  // Resolved lazily: the toast service isn't ready while the app is bootstrapping.
  private readonly injector: Injector = inject(Injector);

  handleError(error: unknown): void {
    console.error(error);
    // errorInterceptor already reported HTTP errors.
    if (error instanceof HttpErrorResponse) return;
    try {
      this.injector.get(NotificationService).error('errors.unexpected');
    } catch {
      /* the toast itself failed; the console log above is enough */
    }
  }
}
