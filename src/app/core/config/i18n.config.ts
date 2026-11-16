import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { environment } from '../../../environments/environment';

export const LANGUAGES = {
  en: { label: 'English', dir: 'ltr' },
  ar: { label: 'العربية', dir: 'rtl' },
} as const;

export const provideI18n = () =>
  provideTranslateService({
    loader: provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
    fallbackLang: 'en',
    lang: environment.defaultLang,
  });
