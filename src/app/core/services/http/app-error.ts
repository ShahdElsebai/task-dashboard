import { HttpErrorResponse } from '@angular/common/http';

import { AppError } from '../../models/app-error.model';

export function toAppError(error: unknown): AppError {
  if (error instanceof HttpErrorResponse) {
    return { status: error.status, messageKey: messageKeyFor(error.status), detail: error.message };
  }
  const detail: string = error instanceof Error ? error.message : String(error);
  return { status: -1, messageKey: 'errors.generic', detail };
}

export function messageKeyFor(status: number): string {
  if (status === 0) return 'errors.network';
  if (status === 404) return 'errors.notFound';
  if (status === 400 || status === 422) return 'errors.validation';
  if (status >= 500) return 'errors.server';
  return 'errors.generic';
}
