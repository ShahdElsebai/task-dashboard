import { DOCUMENT, Service, WritableSignal, effect, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { environment } from '../../../environments/environment';
import { AppLanguage } from '../../../environments/environment.model';
import { LANGUAGES } from '../config/i18n.config';

const STORAGE_KEY: string = 'app.lang';

@Service()
export class LanguageService {
  private readonly translate: TranslateService = inject(TranslateService);
  private readonly document: Document = inject(DOCUMENT);

  readonly current: WritableSignal<AppLanguage> = signal<AppLanguage>(this.readStoredLang());

  constructor() {
    effect(() => {
      const lang: AppLanguage = this.current();
      this.translate.use(lang);
      const html: HTMLElement = this.document.documentElement;
      html.lang = lang;
      html.dir = LANGUAGES[lang].dir;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        /* storage unavailable (private mode, SSR) */
      }
    });
  }

  toggle(): void {
    this.current.update((lang: AppLanguage) => (lang === 'en' ? 'ar' : 'en'));
  }

  private readStoredLang(): AppLanguage {
    try {
      const stored: string | null = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'ar') return stored;
    } catch {
      /* ignore */
    }
    return environment.defaultLang;
  }
}
