import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';

import { delay, from, map, Observable } from 'rxjs';

import { environment } from '@env/environment';

import { Identifiable } from '../../../dto';

export type MockRecord = Identifiable & Record<string, unknown>;
export type MockDb = Record<string, MockRecord[]>;

/** Simulated network latency, so loading states and optimistic updates behave as they do against a server. */
export const MOCK_LATENCY_MS: number = 250;

interface SortField {
  key: string;
  direction: 1 | -1;
}

/** Narrows an unknown request body to a plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''));
}

/**
 * Sorts records the way json-server's `_sort` parameter does.
 *
 * @param records Records to sort; the array is not modified.
 * @param sort Comma-separated field names, each optionally prefixed with `-` for descending
 *     order (e.g. `-timestamp` or `status,-position`). `null` keeps the stored order.
 * @returns A new, sorted array.
 */
export function sortRecords(records: MockRecord[], sort: string | null): MockRecord[] {
  if (!sort) return [...records];
  const fields: SortField[] = sort
    .split(',')
    .filter(Boolean)
    .map((field: string): SortField => ({ key: field.replace(/^-/, ''), direction: field.startsWith('-') ? -1 : 1 }));

  return [...records].sort((a: MockRecord, b: MockRecord): number => {
    for (const { key, direction } of fields) {
      const result: number = compareValues(a[key], b[key]);
      if (result !== 0) return result * direction;
    }
    return 0;
  });
}

function notFound(req: HttpRequest<unknown>): HttpErrorResponse {
  return new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: req.urlWithParams, error: {} });
}

function ok(req: HttpRequest<unknown>, body: unknown, status: number = 200): HttpResponse<unknown> {
  return new HttpResponse({ status, statusText: 'OK', url: req.urlWithParams, body: structuredClone(body) });
}

/**
 * Creates an interceptor that acts as the REST backend, entirely in the browser.
 *
 * It answers `${environment.apiUrl}/<collection>[/<id>]` with the same routes json-server
 * provides for this app (GET list with `_sort`, GET one, POST, PATCH, DELETE) and passes every
 * other request (translations, assets) on to the network. Data lives in memory, so a reload
 * resets it, just as restarting the mock API does.
 *
 * Used only by the `demo` build, which is deployed to GitHub Pages where no server can run.
 *
 * @param loadSeed Loads the initial data once, on the first API request. Lazy, so the seed
 *     doesn't add to the initial bundle.
 * @param latencyMs Delay added to every response.
 * @returns An interceptor to place last in the chain, after the cache and retry interceptors.
 */
export function createMockBackend(
  loadSeed: () => Promise<MockDb>,
  latencyMs: number = MOCK_LATENCY_MS
): HttpInterceptorFn {
  const prefix: string = `${environment.apiUrl.replace(/\/+$/, '')}/`;
  let db: Promise<MockDb> | null = null;
  let created: number = 0;

  function respond(data: MockDb, req: HttpRequest<unknown>, url: URL): HttpResponse<unknown> {
    const segments: string[] = url.pathname.slice(prefix.length).split('/').map(decodeURIComponent);
    const collection: string = segments[0];
    const id: string | undefined = segments[1];
    const records: MockRecord[] | undefined = data[collection];
    if (!records) throw notFound(req);

    const index: number = id === undefined ? -1 : records.findIndex((record: MockRecord): boolean => record.id === id);
    if (id !== undefined && index === -1) throw notFound(req);

    switch (req.method) {
      case 'GET':
        return id === undefined
          ? ok(req, sortRecords(records, url.searchParams.get('_sort')))
          : ok(req, records[index]);
      case 'POST': {
        if (id !== undefined || !isRecord(req.body)) throw notFound(req);
        created += 1;
        const record: MockRecord = { ...req.body, id: `${collection}-${Date.now().toString(36)}-${created}` };
        records.push(record);
        return ok(req, record, 201);
      }
      case 'PATCH': {
        if (id === undefined || !isRecord(req.body)) throw notFound(req);
        const record: MockRecord = { ...records[index], ...req.body, id: records[index].id };
        records[index] = record;
        return ok(req, record);
      }
      case 'DELETE': {
        if (id === undefined) throw notFound(req);
        const removed: MockRecord = records.splice(index, 1)[0];
        return ok(req, removed);
      }
      default:
        throw notFound(req);
    }
  }

  return (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const url: URL = new URL(req.urlWithParams, 'http://mock.local');
    if (!url.pathname.startsWith(prefix)) return next(req);

    db ??= loadSeed().then((seed: MockDb): MockDb => structuredClone(seed));
    return from(db).pipe(
      delay(latencyMs),
      map((data: MockDb): HttpEvent<unknown> => respond(data, req, url))
    );
  };
}
