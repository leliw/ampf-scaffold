import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';

/**
 * Base class for all dictionary / lookup table services
 * Provides caching with shareReplay(1), manual refresh and basic error handling
 *
 * Usage:
 * @Injectable({ providedIn: 'root' })
 * export class FunctionsService extends DictionaryService<FunctionDto> {
 *   protected override endpoint = 'functions';
 * }
 */
@Injectable()
export abstract class BaseDictionaryService<T> {
    // Must be overridden in child class
    protected abstract endpoint: string;

    // Primary key field name, defaults to 'id'
    protected keyName: keyof T = 'id' as keyof T;

    // Optional: change cache lifetime (default = no expiration)
    protected cacheTimeMs = 0; // 0 = cache until manual refresh or app restart

    // Optional: custom base URL (default uses /api)
    protected baseUrl = '/api';

    // Private cache
    private _cache$: Observable<T[]> | null = null;

    constructor(protected http: HttpClient) { }

    /**
     * Returns cached or fresh dictionary data
     */
    getAll(): Observable<T[]> {
        if (this._cache$) {
            return this._cache$;
        }

        const url = `${this.baseUrl}/${this.endpoint}`;

        this._cache$ = this.http.get<T[]>(url).pipe(
            tap(data => this.onLoaded(data)),
            shareReplay(1, this.cacheTimeMs || undefined), // undefined = cache forever
            catchError(err => {
                this.clearCache();
                return throwError(() => err);
            })
        );
        return this._cache$;
    }

    /**
     * Forces reload on next getAll() call
     */
    refresh(): void {
        this.clearCache();
        // Trigger new request immediately if someone is listening
        this.getAll().subscribe({
            error: err => console.error('Error during auto-refresh:', err)
        }); // fire-and-forget
    }

    /**
     * Clears cache – next getAll() will hit backend again
     */
    clearCache(): void {
        this._cache$ = null;
    }

    /**
     * Optional: get single item from cache by key (without additional HTTP call)
     */
    getById(id: any): Observable<T | undefined> {
        return this._cache$?.pipe(
            map(items => items.find(item => item[this.keyName] === id))
        ) ?? this.getAll().pipe(
            map(items => items.find(item => item[this.keyName] === id))
        );
    }

    /**
     * Hook – called after successful load (e.g. for logging or sorting)
     */
    protected onLoaded(data: T[]): void {
        // Override if needed, e.g.:
        // data.sort((a, b) => a.name.localeCompare(b.name));
    }
}
