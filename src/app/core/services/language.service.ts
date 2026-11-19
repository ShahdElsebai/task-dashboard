import { DOCUMENT, effect, inject, Service, signal, WritableSignal } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { environment } from '@env/environment';
import { AppLanguage } from '@env/environment.model';

import { LANGUAGE_STORAGE_KEY, LANGUAGES } from '../config/i18n.config';

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
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      } catch {}
    });
  }

  toggle(): void {
    this.current.update((lang: AppLanguage) => (lang === 'en' ? 'ar' : 'en'));
  }

  private readStoredLang(): AppLanguage {
    try {
      const stored: string | null = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'en' || stored === 'ar') return stored;
    } catch {}
    return environment.defaultLang;
  }
}
