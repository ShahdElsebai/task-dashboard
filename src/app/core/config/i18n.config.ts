import { Provider } from '@angular/core';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { environment } from '@env/environment';
import { AppLanguage } from '@env/environment.model';

import { LanguageOption } from '../models/language.model';

export const LANGUAGES: Readonly<Record<AppLanguage, LanguageOption>> = {
  en: { label: 'English', dir: 'ltr' },
  ar: { label: 'العربية', dir: 'rtl' },
};

/**
 * Path the app is served from, read from `<base href>`: `/` locally and in Docker,
 * `/<repo>/` on GitHub Pages. Translations are fetched relative to it.
 */
export function appBasePath(): string {
  return typeof document === 'undefined' ? '/' : new URL(document.baseURI).pathname;
}

export function provideI18n(): Provider[] {
  return provideTranslateService({
    loader: provideTranslateHttpLoader({ prefix: `${appBasePath()}assets/i18n/`, suffix: '.json' }),
    fallbackLang: 'en',
    lang: environment.defaultLang,
  });
}

export const LANGUAGE_STORAGE_KEY: string = 'app.lang';
