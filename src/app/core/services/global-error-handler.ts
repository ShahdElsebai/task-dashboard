import { ErrorHandler, Injector, Service, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from './notification.service';

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
