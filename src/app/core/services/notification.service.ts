import { inject, Injector, Service } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { MessageService } from '@openng/optimus-ui/api';

import { DEDUPE_WINDOW_MS } from '../config/notification.config';

/**
 * Shows translated toasts.
 *
 * Two details matter here:
 * - `TranslateService` is resolved lazily through the `Injector`. Injecting it directly creates
 *   a cycle (TranslateService → HttpClient → errorInterceptor → NotificationService →
 *   TranslateService), which fails with NG0200 and leaves the UI untranslated.
 * - The same message is shown once per `DEDUPE_WINDOW_MS`, so one failure seen by several
 *   requests (e.g. the API is down) doesn't stack identical toasts.
 */
@Service()
export class NotificationService {
  private readonly messages: MessageService = inject(MessageService);
  private readonly injector: Injector = inject(Injector);
  private readonly lastShown: Map<string, number> = new Map<string, number>();

  success(detailKey: string, params?: Record<string, unknown>): void {
    this.show('success', 'notifications.success', detailKey, params);
  }

  error(detailKey: string, params?: Record<string, unknown>): void {
    this.show('error', 'errors.title', detailKey, params);
  }

  private show(severity: string, summaryKey: string, detailKey: string, params?: Record<string, unknown>): void {
    const id: string = `${severity}:${detailKey}`;
    const now: number = Date.now();
    if (now - (this.lastShown.get(id) ?? -Infinity) < DEDUPE_WINDOW_MS) return;
    this.lastShown.set(id, now);

    const translate: TranslateService = this.injector.get(TranslateService);
    this.messages.add({
      severity,
      summary: translate.instant(summaryKey),
      detail: translate.instant(detailKey, params),
      life: 5000,
    });
  }
}
