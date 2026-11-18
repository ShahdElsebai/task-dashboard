import { HttpClient, HttpContext, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LoadingService } from '../loading.service';
import { NotificationService } from '../notification.service';
import { apiUrlInterceptor } from './api-url.interceptor';
import { messageKeyFor, toAppError } from './app-error';
import { cacheInterceptor } from './cache.interceptor';
import { errorInterceptor } from './error.interceptor';
import { CACHE_TTL_MS, HttpCacheService, collectionOf } from './http-cache.service';
import { SKIP_CACHE, SKIP_ERROR_TOAST, SKIP_LOADING } from './http-context.tokens';
import { loadingInterceptor } from './loading.interceptor';
import { retryInterceptor } from './retry.interceptor';

const notifications: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> } = {
  error: vi.fn(),
  success: vi.fn(),
};

function setup(): { http: HttpClient; ctrl: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(
        withInterceptors([apiUrlInterceptor, loadingInterceptor, errorInterceptor, cacheInterceptor, retryInterceptor])
      ),
      provideHttpClientTesting(),
      { provide: NotificationService, useValue: notifications },
    ],
  });
  return { http: TestBed.inject(HttpClient), ctrl: TestBed.inject(HttpTestingController) };
}

describe('HTTP interceptors', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('apiUrlInterceptor', () => {
    it('prefixes relative paths with the API base URL', () => {
      const { http, ctrl } = setup();
      http.get('tasks').subscribe();
      ctrl.expectOne('/api/tasks').flush([]);
    });

    it('leaves root paths and absolute URLs alone', () => {
      const { http, ctrl } = setup();
      http.get('/assets/i18n/en.json').subscribe();
      http.get('https://example.com/x').subscribe();
      ctrl.expectOne('/assets/i18n/en.json').flush({});
      ctrl.expectOne('https://example.com/x').flush({});
    });
  });

  describe('cacheInterceptor', () => {
    it('serves a repeated GET from cache', () => {
      const { http, ctrl } = setup();
      const results: unknown[] = [];
      http.get('tasks').subscribe((r: unknown) => results.push(r));
      ctrl.expectOne('/api/tasks').flush([1]);
      http.get('tasks').subscribe((r: unknown) => results.push(r));
      ctrl.expectNone('/api/tasks');
      expect(results).toEqual([[1], [1]]);
    });

    it('skips the cache when asked', () => {
      const { http, ctrl } = setup();
      http.get('tasks').subscribe();
      ctrl.expectOne('/api/tasks').flush([]);
      http.get('tasks', { context: new HttpContext().set(SKIP_CACHE, true) }).subscribe();
      ctrl.expectOne('/api/tasks').flush([]);
    });

    it('invalidates the collection after a write', () => {
      const { http, ctrl } = setup();
      http.get('tasks').subscribe();
      ctrl.expectOne('/api/tasks').flush([]);
      http.patch('tasks/task-1', {}).subscribe();
      ctrl.expectOne('/api/tasks/task-1').flush({});
      http.get('tasks').subscribe();
      ctrl.expectOne('/api/tasks').flush([]);
    });
  });

  describe('retryInterceptor', () => {
    it('retries a GET on server errors, then succeeds', () => {
      vi.useFakeTimers();
      const { http, ctrl } = setup();
      let result: unknown;
      http.get('tasks', { context: new HttpContext().set(SKIP_CACHE, true) }).subscribe((r: unknown) => (result = r));
      ctrl.expectOne('/api/tasks').flush(null, { status: 503, statusText: 'Unavailable' });
      vi.advanceTimersByTime(300);
      ctrl.expectOne('/api/tasks').flush(null, { status: 500, statusText: 'Error' });
      vi.advanceTimersByTime(600);
      ctrl.expectOne('/api/tasks').flush(['ok']);
      expect(result).toEqual(['ok']);
      expect(notifications.error).not.toHaveBeenCalled();
    });

    it('does not retry 4xx or writes', () => {
      const { http, ctrl } = setup();
      http.get('tasks/missing').subscribe({ error: () => undefined });
      ctrl.expectOne('/api/tasks/missing').flush(null, { status: 404, statusText: 'Not Found' });
      http.post('tasks', {}).subscribe({ error: () => undefined });
      ctrl.expectOne('/api/tasks').flush(null, { status: 500, statusText: 'Error' });
      ctrl.expectNone('/api/tasks');
    });
  });

  describe('errorInterceptor', () => {
    it('rethrows the error so callers can roll back', () => {
      const { http, ctrl } = setup();
      let caught: unknown;
      http.delete('tasks/1').subscribe({ error: (e: unknown) => (caught = e) });
      ctrl.expectOne('/api/tasks/1').flush(null, { status: 400, statusText: 'Bad' });
      expect(caught).toBeInstanceOf(HttpErrorResponse);
      expect(notifications.error).toHaveBeenCalledWith('errors.validation');
    });

    it('does not toast failed reads; the section shows <app-error-state> instead', () => {
      const { http, ctrl } = setup();
      http.get('users').subscribe({ error: () => undefined });
      ctrl.expectOne('/api/users').flush(null, { status: 404, statusText: 'Not Found' });
      expect(notifications.error).not.toHaveBeenCalled();
    });

    it('toasts failed writes, because the user needs to know their change was not saved', () => {
      const { http, ctrl } = setup();
      http.post('tasks', {}).subscribe({ error: () => undefined });
      ctrl.expectOne('/api/tasks').flush(null, { status: 500, statusText: 'Error' });
      expect(notifications.error).toHaveBeenCalledWith('errors.server');
    });

    it('stays quiet with SKIP_ERROR_TOAST', () => {
      const { http, ctrl } = setup();
      http.delete('tasks/1', { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }).subscribe({
        error: () => undefined,
      });
      ctrl.expectOne('/api/tasks/1').flush(null, { status: 400, statusText: 'Bad' });
      expect(notifications.error).not.toHaveBeenCalled();
    });
  });

  describe('loadingInterceptor', () => {
    it('is loading while a request is in flight', () => {
      const { http, ctrl } = setup();
      const loading: LoadingService = TestBed.inject(LoadingService);
      http.get('users').subscribe();
      expect(loading.isLoading()).toBe(true);
      ctrl.expectOne('/api/users').flush([]);
      expect(loading.isLoading()).toBe(false);
    });

    it('ignores requests marked SKIP_LOADING', () => {
      const { http, ctrl } = setup();
      const loading: LoadingService = TestBed.inject(LoadingService);
      http.get('users', { context: new HttpContext().set(SKIP_LOADING, true) }).subscribe();
      expect(loading.isLoading()).toBe(false);
      ctrl.expectOne('/api/users').flush([]);
    });
  });
});

describe('HttpCacheService', () => {
  it('expires entries after the TTL', () => {
    const cache: HttpCacheService = new HttpCacheService();
    const response: never = {} as never;
    cache.set('/api/tasks', response, 0);
    expect(cache.get('/api/tasks', CACHE_TTL_MS - 1)).toBe(response);
    expect(cache.get('/api/tasks', CACHE_TTL_MS)).toBeNull();
  });

  it('maps URLs to their collection', () => {
    expect(collectionOf('/api/tasks/task-1?x=1')).toBe('/api/tasks');
    expect(collectionOf('/api/tasks?_sort=position')).toBe('/api/tasks');
    expect(collectionOf('/assets/i18n/en.json')).toBe('/assets/i18n/en.json');
  });
});

describe('toAppError', () => {
  it('maps statuses to message keys', () => {
    expect(messageKeyFor(0)).toBe('errors.network');
    expect(messageKeyFor(404)).toBe('errors.notFound');
    expect(messageKeyFor(422)).toBe('errors.validation');
    expect(messageKeyFor(503)).toBe('errors.server');
    expect(messageKeyFor(401)).toBe('errors.generic');
  });

  it('handles non-HTTP errors', () => {
    expect(toAppError(new Error('boom'))).toEqual({ status: -1, messageKey: 'errors.generic', detail: 'boom' });
  });
});
