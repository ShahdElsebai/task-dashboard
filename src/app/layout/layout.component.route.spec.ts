import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MessageService } from '@openng/optimus-ui/api';

import { routes } from '../app.routes';

describe('app routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        MessageService,
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('redirects the root to the dashboard', async () => {
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });

  it('shows the not-found page for unknown URLs', async () => {
    await harness.navigateByUrl('/does-not-exist');
    expect(harness.routeNativeElement?.querySelector('app-not-found')).toBeTruthy();
  });

  it('lazy-loads a placeholder page with its title key from route data', async () => {
    await harness.navigateByUrl('/team');
    expect(harness.routeNativeElement?.textContent).toContain('nav.team');
  });
});
