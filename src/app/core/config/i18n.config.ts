import { Provider } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { environment } from '../../../environments/environment';
import { AppLanguage } from '../../../environments/environment.model';
import { LanguageOption } from '../models/language.model';

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

export const LANGUAGE_STORAGE_KEY: string = 'app.lang';
