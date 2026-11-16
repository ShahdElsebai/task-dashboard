import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideOptimus } from '@openng/optimus-ui/config';

import { routes } from './app.routes';
import { AppPreset } from './core/theme/app-preset';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideOptimus({
      theme: {
        preset: AppPreset,
        options: { darkModeSelector: '.app-dark' },
      },
    }),
  ],
};
