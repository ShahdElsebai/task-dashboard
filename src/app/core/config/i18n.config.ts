import type { Provider } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { environment } from '../../../environments/environment';
import type { AppLanguage } from '../../../environments/environment.model';

export interface LanguageOption {
  label: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: Readonly<Record<AppLanguage, LanguageOption>> = {
  en: { label: 'English', dir: 'ltr' },
  ar: { label: 'العربية', dir: 'rtl' },
};

export function provideI18n(): Provider[] {
  return provideTranslateService({
    loader: provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
    fallbackLang: 'en',
    lang: environment.defaultLang,
  });
}
