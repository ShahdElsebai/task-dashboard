import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';

import { Observable, of, tap } from 'rxjs';

import { HttpCacheService } from './http-cache.service';
import { SKIP_CACHE } from './http-context.tokens';

/**
 * Caches GET responses for `CACHE_TTL_MS`.
 *
 * Any successful write clears the cached responses of the same collection
 * (a PATCH to /api/tasks/1 clears /api/tasks), so a page never shows data older than its own
 * last change. Requests with `SKIP_CACHE` bypass the cache.
 */
export const cacheInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const cache: HttpCacheService = inject(HttpCacheService);

  if (req.method !== 'GET') {
    return next(req).pipe(tap({ next: (): void => cache.invalidate(req.url) }));
  }
  if (req.context.get(SKIP_CACHE)) return next(req);

  const key: string = req.urlWithParams;
  const cached: HttpResponse<unknown> | null = cache.get(key);
  if (cached) return of(cached.clone());

  return next(req).pipe(
    tap((event: HttpEvent<unknown>): void => {
      if (event instanceof HttpResponse) cache.set(key, event.clone());
    })
  );
};
