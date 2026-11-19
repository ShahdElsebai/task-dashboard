import { HttpInterceptorFn } from '@angular/common/http';

import { createMockBackend, MockDb } from './mock-backend.interceptor';

/** Loads the same seed data json-server uses, in its own chunk. */
function loadSeed(): Promise<MockDb> {
  return import('../../../../../../mock-api/db.json').then((module: { default: MockDb }): MockDb => module.default);
}

/** Demo build only: answers API requests in the browser (see `mock-backend.providers.ts`). */
export const MOCK_BACKEND_INTERCEPTORS: HttpInterceptorFn[] = [createMockBackend(loadSeed)];
