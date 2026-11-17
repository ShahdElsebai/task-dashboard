import type { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import type { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

export const apiUrlInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  if (/^(https?:)?\/\//.test(req.url) || req.url.startsWith('/')) return next(req);
  const base: string = environment.apiUrl.replace(/\/+$/, '');
  return next(req.clone({ url: `${base}/${req.url}` }));
};
