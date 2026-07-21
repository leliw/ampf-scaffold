import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

export interface Config {
    version: string;
}

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private http = inject(HttpClient);
    private readonly url = '/api/config';

    private readonly _config = signal<Config | null>(null);

    public readonly config = this._config.asReadonly();

    public loadConfig(): Observable<Config> {
        return this.http.get<Config>(this.url).pipe(
            tap(config => this._config.set(config)),
            catchError(err => {
                console.error('Failed to load config', err);
                const fallbackConfig = { version: 'unknown' };
                this._config.set(fallbackConfig);
                return of(fallbackConfig);
            })
        );
    }

    public getConfigValue<K extends keyof Config>(key: K) {
        return computed(() => {
            const currentConfig = this._config();
            return currentConfig ? currentConfig[key] : null;
        });
    }
}
