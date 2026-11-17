import type { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { type Observable, finalize } from 'rxjs';

import { LoadingService } from '../loading.service';
import { SKIP_LOADING } from './http-context.tokens';

/** Tracks every request in LoadingService unless it opts out with SKIP_LOADING. */
export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  if (req.context.get(SKIP_LOADING)) return next(req);
  const loading: LoadingService = inject(LoadingService);
  loading.start();
  return next(req).pipe(finalize((): void => loading.stop()));
};
