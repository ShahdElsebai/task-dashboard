import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { firstValueFrom } from 'rxjs';
import type { Mock } from 'vitest';

import { apiUrlInterceptor } from '../api-url.interceptor';
import { createMockBackend, MockDb, MockRecord, sortRecords } from './mock-backend.interceptor';

const SEED: MockDb = {
  tasks: [
    { id: 't1', title: 'B', position: 2000 },
    { id: 't2', title: 'A', position: 1000 },
  ],
  activities: [
    { id: 'a1', timestamp: '2026-01-01T10:00:00Z' },
    { id: 'a2', timestamp: '2026-01-02T10:00:00Z' },
  ],
};

type SeedLoader = Mock<() => Promise<MockDb>>;

function setup(): { http: HttpClient; ctrl: HttpTestingController; loadSeed: SeedLoader } {
  const loadSeed: SeedLoader = vi.fn((): Promise<MockDb> => Promise.resolve(SEED));
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([apiUrlInterceptor, createMockBackend(loadSeed, 0)])),
      provideHttpClientTesting(),
    ],
  });
  return { http: TestBed.inject(HttpClient), ctrl: TestBed.inject(HttpTestingController), loadSeed };
}

async function statusOf(request: Promise<unknown>): Promise<number> {
  try {
    await request;
    return 200;
  } catch (error: unknown) {
    return error instanceof HttpErrorResponse ? error.status : -1;
  }
}

describe('sortRecords', () => {
  const records: MockRecord[] = [
    { id: '1', group: 'b', n: 2 },
    { id: '2', group: 'a', n: 10 },
    { id: '3', group: 'a', n: 1 },
  ];

  it('keeps the stored order without a sort', () => {
    expect(sortRecords(records, null).map((r: MockRecord): string => r.id)).toEqual(['1', '2', '3']);
  });

  it('sorts numbers numerically, descending with a minus prefix', () => {
    expect(sortRecords(records, '-n').map((r: MockRecord): string => r.id)).toEqual(['2', '1', '3']);
  });

  it('sorts by several fields in order', () => {
    expect(sortRecords(records, 'group,n').map((r: MockRecord): string => r.id)).toEqual(['3', '2', '1']);
  });
});

describe('createMockBackend', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('lists a collection, honouring _sort', async () => {
    const { http } = setup();
    const activities: MockRecord[] = await firstValueFrom(http.get<MockRecord[]>('activities?_sort=-timestamp'));
    expect(activities.map((a: MockRecord): string => a.id)).toEqual(['a2', 'a1']);
  });

  it('creates, updates and deletes records, and later reads see the changes', async () => {
    const { http } = setup();

    const created: MockRecord = await firstValueFrom(http.post<MockRecord>('tasks', { title: 'New' }));
    expect(created.id).toMatch(/^tasks-/);

    const updated: MockRecord = await firstValueFrom(
      http.patch<MockRecord>(`tasks/${created.id}`, { title: 'Renamed' })
    );
    expect(updated).toEqual({ ...created, title: 'Renamed' });

    await firstValueFrom(http.delete(`tasks/t1`));
    const tasks: MockRecord[] = await firstValueFrom(http.get<MockRecord[]>('tasks'));
    expect(tasks.map((t: MockRecord): unknown => t['title'])).toEqual(['A', 'Renamed']);
  });

  it('never mutates the seed and loads it only once', async () => {
    const { http, loadSeed } = setup();
    await firstValueFrom(http.patch('tasks/t1', { title: 'Changed' }));
    await firstValueFrom(http.get('tasks'));

    expect(SEED['tasks'][0]['title']).toBe('B');
    expect(loadSeed).toHaveBeenCalledTimes(1);
  });

  it('returns copies, so callers cannot change stored data by accident', async () => {
    const { http } = setup();
    const first: MockRecord = await firstValueFrom(http.get<MockRecord>('tasks/t1'));
    first['title'] = 'Mutated';
    const second: MockRecord = await firstValueFrom(http.get<MockRecord>('tasks/t1'));
    expect(second['title']).toBe('B');
  });

  it('answers 404 for unknown collections, ids and unsupported calls', async () => {
    const { http } = setup();
    expect(await statusOf(firstValueFrom(http.get('nope')))).toBe(404);
    expect(await statusOf(firstValueFrom(http.get('tasks/missing')))).toBe(404);
    expect(await statusOf(firstValueFrom(http.patch('tasks', { title: 'x' })))).toBe(404);
    expect(await statusOf(firstValueFrom(http.put('tasks/t1', {})))).toBe(404);
  });

  it('passes non-API requests on to the network', () => {
    const { http, ctrl } = setup();
    http.get('/assets/i18n/en.json').subscribe();
    ctrl.expectOne('/assets/i18n/en.json').flush({});
  });
});
