import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { MessageService } from '@openng/optimus-ui/api';
import { provideOptimus } from '@openng/optimus-ui/config';

import { provideI18n } from '@core/config/i18n.config';
import { AppThemePreset } from '@core/config/theme.preset';
import { GlobalErrorHandler } from '@core/services/global-error-handler';
import {
  apiUrlInterceptor,
  cacheInterceptor,
  errorInterceptor,
  loadingInterceptor,
  MOCK_BACKEND_INTERCEPTORS,
  retryInterceptor,
} from '@core/services/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(
      withInterceptors([
        apiUrlInterceptor,
        loadingInterceptor,
        errorInterceptor,
        cacheInterceptor,
        retryInterceptor,
        ...MOCK_BACKEND_INTERCEPTORS,
      ])
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
