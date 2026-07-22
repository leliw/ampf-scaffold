import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

const EXCLUDED_ROUTES = [
    '/api/ping',
    '/api/config',
    '/api/login',
    '/api/logout',
    '/api/google/login',
    '/api/refresh-token',
    '/api/reset-password-request',
    '/api/reset-password'
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    if (!req.url.startsWith('/api')) {
        return next(req);
    }
    
    const urlPath = req.url.split('?')[0];
    const isExcluded = EXCLUDED_ROUTES.some(route => urlPath.endsWith(route));
    if (isExcluded) {
        return next(req);
    }

    const authService = inject(AuthService);

    if (!authService.isAuthenticated()) {
        return next(req);
    }

    const headers = req.headers.set('Authorization', `Bearer ${authService.access_token}`);
    const authReq = req.clone({ headers });

    return next(authReq).pipe(
        catchError(err => {
            if (err.status === 401) {
                return authService.refreshToken().pipe(
                    switchMap(newTokens => {
                            // Retry original request with new token
                        const newReq = req.clone({
                            setHeaders: { Authorization: `Bearer ${newTokens.access_token}` }
                        });
                        return next(newReq);
                    }),
                    catchError(refreshErr => {
                        if (refreshErr.status === 401) {
                            console.error('Refresh token error:', refreshErr);
                        }
                        return throwError(() => refreshErr);
                    })
                );
            }
            return throwError(() => err);
        })
    );
};
