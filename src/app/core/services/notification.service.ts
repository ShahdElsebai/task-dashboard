import { Injector, Service, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from '@openng/optimus-ui/api';

/** Thin wrapper over the Optimus toast so the rest of the app doesn't depend on it directly. */
@Service()
export class NotificationService {
  private readonly messages: MessageService = inject(MessageService);
  /**
   * TranslateService is resolved lazily, not injected in the constructor.
   * It loads its JSON through HttpClient → errorInterceptor → this service,
   * so injecting it eagerly creates a circular dependency (NG0200).
   */
  private readonly injector: Injector = inject(Injector);

  success(detailKey: string, params?: Record<string, unknown>): void {
    this.show('success', 'notifications.success', detailKey, params);
  }

  error(detailKey: string, params?: Record<string, unknown>): void {
    this.show('error', 'errors.title', detailKey, params);
  }

  private show(severity: string, summaryKey: string, detailKey: string, params?: Record<string, unknown>): void {
    const translate: TranslateService = this.injector.get(TranslateService);
    this.messages.add({
      severity,
      summary: translate.instant(summaryKey),
      detail: translate.instant(detailKey, params),
      life: 5000,
    });
  }
}
