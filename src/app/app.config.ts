import { ErrorHandler, type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { MessageService } from '@openng/optimus-ui/api';
import { provideOptimus } from '@openng/optimus-ui/config';

import { routes } from './app.routes';
import { AppThemePreset } from './core/config/theme.preset';
import { provideI18n } from './core/config/i18n.config';
import { GlobalErrorHandler } from './core/services/global-error-handler';
import {
  apiUrlInterceptor,
  cacheInterceptor,
  errorInterceptor,
  loadingInterceptor,
  retryInterceptor,
} from './core/services/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      withInterceptors([apiUrlInterceptor, loadingInterceptor, errorInterceptor, cacheInterceptor, retryInterceptor])
    ),
    MessageService,
    provideI18n(),
    provideOptimus({
      theme: {
        preset: AppThemePreset,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: { name: 'optimus', order: 'theme, base, optimus' },
        },
      },
    }),
  ],
};
