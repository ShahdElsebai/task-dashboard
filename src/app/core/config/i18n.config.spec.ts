import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from '@openng/optimus-ui/api';
import { firstValueFrom } from 'rxjs';

import {
  apiUrlInterceptor,
  cacheInterceptor,
  errorInterceptor,
  loadingInterceptor,
  retryInterceptor,
} from '../services/http';
import { provideI18n } from './i18n.config';

// Regression: errorInterceptor → NotificationService → TranslateService used to be circular (NG0200).
describe('i18n with the real interceptor chain', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([
            apiUrlInterceptor,
            loadingInterceptor,
            errorInterceptor,
            cacheInterceptor,
            retryInterceptor,
          ])
        ),
        provideHttpClientTesting(),
        MessageService,
        provideI18n(),
      ],
    });
  });

  it('loads translations without a circular dependency', async () => {
    const translate: TranslateService = TestBed.inject(TranslateService);
    const http: HttpTestingController = TestBed.inject(HttpTestingController);
    const loaded: Promise<unknown> = firstValueFrom(translate.use('en'));

    http
      .match('/assets/i18n/en.json')
      .forEach((req: { flush: (body: object) => void }) => req.flush({ app: { title: 'Task Dashboard' } }));
    await loaded;

    expect(translate.instant('app.title')).toBe('Task Dashboard');
  });
});
