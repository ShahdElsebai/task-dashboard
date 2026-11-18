import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MessageService } from '@openng/optimus-ui/api';

import { NotificationService } from './notification.service';
import { DEDUPE_WINDOW_MS } from '../config/notification.config';

describe('NotificationService', () => {
  let service: NotificationService;
  let add: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [MessageService, provideTranslateService()] });
    service = TestBed.inject(NotificationService);
    add = vi.spyOn(TestBed.inject(MessageService), 'add');
  });

  afterEach(() => vi.useRealTimers());

  it('shows identical messages only once within the dedupe window', () => {
    service.error('errors.server');
    service.error('errors.server');
    service.error('errors.server');
    expect(add).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(DEDUPE_WINDOW_MS);
    service.error('errors.server');
    expect(add).toHaveBeenCalledTimes(2);
  });

  it('shows different messages and severities separately', () => {
    service.error('errors.server');
    service.error('errors.network');
    service.success('errors.server');
    expect(add).toHaveBeenCalledTimes(3);
  });
});
