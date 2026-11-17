import { Injector, Service, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from '@openng/optimus-ui/api';

@Service()
export class NotificationService {
  private readonly messages: MessageService = inject(MessageService);
  // Resolved lazily: TranslateService loads via HttpClient → errorInterceptor → this service (NG0200).
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
