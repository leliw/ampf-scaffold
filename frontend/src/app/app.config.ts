import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';
import { ApplicationConfig, inject, LOCALE_ID, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { ConfigService } from './core/config.service';
import { authInterceptor } from './core/auth/auth.interceptor';

registerLocaleData(localePl);

function getBrowserLocale(): string {
    if (typeof navigator === 'undefined') {
        return 'en-US';
    }

    const locale = (
        navigator.languages?.[0] ||
        navigator.language ||
        'en-US'
    ).toLowerCase();

    return locale === 'pl' || locale.startsWith('pl-') ? 'pl-PL' : 'en-US';
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideAppInitializer(() => {
            const configService = inject(ConfigService);
            return configService.loadConfig();
        }),
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes, withComponentInputBinding()),
        { provide: LOCALE_ID, useFactory: getBrowserLocale },
        { provide: MAT_DATE_LOCALE, useExisting: LOCALE_ID },
        provideNativeDateAdapter(),
    ],
};
