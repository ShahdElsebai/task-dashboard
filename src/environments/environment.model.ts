/** Shape every environment file must follow. */
export interface Environment {
  production: boolean;
  apiUrl: string;
  defaultLang: AppLanguage;
}

export type AppLanguage = 'en' | 'ar';
