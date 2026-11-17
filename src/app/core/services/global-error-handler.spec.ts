import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { GlobalErrorHandler } from './global-error-handler';
import { NotificationService } from './notification.service';

describe('GlobalErrorHandler', () => {
  const notifications: { error: ReturnType<typeof vi.fn> } = { error: vi.fn() };
  let handler: GlobalErrorHandler;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [GlobalErrorHandler, { provide: NotificationService, useValue: notifications }],
    });
    handler = TestBed.inject(GlobalErrorHandler);
  });

  afterEach(() => vi.restoreAllMocks());

  it('logs and toasts uncaught errors', () => {
    handler.handleError(new Error('boom'));
    expect(console.error).toHaveBeenCalled();
    expect(notifications.error).toHaveBeenCalledWith('errors.unexpected');
  });

  it('does not toast HTTP errors twice', () => {
    notifications.error.mockClear();
    handler.handleError(new HttpErrorResponse({ status: 500 }));
    expect(notifications.error).not.toHaveBeenCalled();
  });
});
