import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideOptimus } from '@openng/optimus-ui/config';

import { routes } from './app.routes';
import { AppPreset } from './core/config/app-preset';
import { provideI18n } from './core/config/i18n.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideI18n(),
    provideOptimus({
      theme: {
        preset: AppPreset,
        options: {
          darkModeSelector: '.app-dark',
          // Lets Tailwind utilities override Optimus component styles.
          cssLayer: { name: 'optimus', order: 'theme, base, optimus' },
        },
      },
    }),
  ],
};
