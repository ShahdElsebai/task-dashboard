import { httpResource, HttpResourceRef, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { valueOr } from './resource.utils';

describe('valueOr', () => {
  let ref: HttpResourceRef<number[]>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    ref = runInInjectionContext(TestBed.inject(Injector), () =>
      httpResource<number[]>(() => '/items', { defaultValue: [] })
    );
    TestBed.tick();
  });

  it('returns the value once loaded', async () => {
    http.expectOne('/items').flush([1, 2]);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(valueOr(ref, [])).toEqual([1, 2]);
  });

  it('returns the fallback instead of throwing after an error', async () => {
    http.expectOne('/items').flush('down', { status: 500, statusText: 'Error' });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(() => ref.value()).toThrow();
    expect(valueOr(ref, [])).toEqual([]);
  });
});
