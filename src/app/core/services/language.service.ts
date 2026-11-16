import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { environment } from '../../../environments/environment';
import type { AppLanguage } from '../../../environments/environment.model';
import { LANGUAGES } from '../config/i18n.config';

const STORAGE_KEY = 'app.lang';

/**
 * Holds the current UI language as a signal and keeps
 * ngx-translate, `<html lang>` and `<html dir>` in sync with it.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  /** Current UI language. */
  readonly current = signal<AppLanguage>(this.readStoredLang());

  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  constructor() {
    effect(() => {
      const lang = this.current();
      this.translate.use(lang);
      const html = this.document.documentElement;
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
    this.current.update((lang) => (lang === 'en' ? 'ar' : 'en'));
  }

  private readStoredLang(): AppLanguage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'ar') return stored;
    } catch {
      /* ignore */
    }
    return environment.defaultLang;
  }
}
