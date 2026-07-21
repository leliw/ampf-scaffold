import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { ConfigService } from './core/config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAppInitializer(() => {
      const configService = inject(ConfigService);
      return configService.loadConfig();
    }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
  ]
};
