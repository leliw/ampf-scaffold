import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, finalize, Observable, of, take, tap, throwError } from 'rxjs';
import { AuthStateService } from './auth-state.service';


export interface Credentials {
    username: string;
    password: string;
}

export interface Tokens {
    access_token: string;
    refresh_token: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private authState = inject(AuthStateService);

    access_token?: string;
    refresh_token?: string;
    store_token = false;
    redirectUrl: string | undefined;

    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<Tokens | null> = new BehaviorSubject<Tokens | null>(null);


    constructor() {
        this.loadTokensFromLocalStorage();
    }

    private loadTokensFromLocalStorage(): void {
        const storedAccessToken = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
        const storedRefreshToken = localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");

        if (storedAccessToken && storedRefreshToken) {
            this.access_token = storedAccessToken;
            this.refresh_token = storedRefreshToken;
            this.store_token = !!localStorage.getItem("access_token");
            this.authState.setUserData({ access_token: storedAccessToken, refresh_token: storedRefreshToken });
        }
    }

    /**
     * Login user with username and password
     * @param credentials 
     * @returns 
     */
    login(credentials: Credentials, store_token = false): Observable<Tokens> {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);
        this.store_token = store_token;
        return this.http.post<Tokens>('/api/login', formData).pipe(
            tap((tokens) => {
                this.storeTokensIfNeeded(tokens);
                this.authState.setUserData(tokens);
                this.redirectAfterLogin();
            })
        );
    }

    /**
     * Logout user from server, clear data and redirect to login page
     * @returns Observable<void>
     */
    logout(): Observable<void> {
        console.log("Logout");
        if (this.refresh_token) {
            const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.refresh_token}` });
            return this.http.post<void>('/api/logout', {}, { headers }).pipe(finalize(() => {
                this.authState.clear();
                this.clearStoredTokens();
                this.router.navigate(['/login']);
            }));
        } else {
            this.authState.clear();
            this.clearStoredTokens();
            this.router.navigate(['/login']);
            return of(undefined);
        }
    }

    redirectAfterLogin(): void {
        if (this.redirectUrl) {
            this.router.navigate([this.redirectUrl]);
            this.redirectUrl = undefined;
        } else {
            this.router.navigate(['/']);
        }
    }

    /**
     * Check if user is logged in
     * @returns boolean
     */
    isAuthenticated(): boolean {
        return this.authState.isAuthenticated();
    }

    /**
     * Set tokens (also in browser local storage)
     * @param tokens 
     */
    storeTokensIfNeeded(tokens: Tokens): void {
        this.access_token = tokens.access_token;
        this.refresh_token = tokens.refresh_token;
        if (this.store_token) {
            localStorage.setItem("access_token", this.access_token);
            localStorage.setItem("refresh_token", this.refresh_token);
        } else {
            sessionStorage.setItem("access_token", this.access_token);
            sessionStorage.setItem("refresh_token", this.refresh_token);
        }
    }

    clearStoredTokens(): void {
        this.access_token = undefined;
        this.refresh_token = undefined;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
    }

    resetPasswordRequest(email: string): Observable<void> {
        return this.http.post<void>("/api/reset-password-request", { email });
    }

    resetPassword(email: string, reset_code: string, new_password: string): Observable<void> {
        return this.http.post<void>("/api/reset-password", { email, reset_code, new_password });
    }

    changePassword(old_password: string, new_password: string): Observable<void> {
        return this.http.post<void>('/api/change-password', { old_password, new_password });
    }

    refreshToken(): Observable<Tokens> {
        if (this.isRefreshing) {
            // If already refreshing, wait for new access token
            return this.refreshTokenSubject.pipe(
                filter((token): token is Tokens => token !== null),
                take(1)
            );
        }

        this.isRefreshing = true;
        this.refreshTokenSubject.next(null);

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${this.refresh_token}`
        });

        return this.http.post<Tokens>('/api/refresh-token', {}, { headers }).pipe(
            tap(tokens => {
                this.authState.setUserData(tokens);
                this.storeTokensIfNeeded(tokens);
                this.refreshTokenSubject.next(tokens);
            }),
            catchError(err => {
                this.refreshTokenSubject.error(err);
                this.refreshTokenSubject = new BehaviorSubject<Tokens | null>(null);
                this.authState.clear();
                this.clearStoredTokens();
                this.router.navigate(['/login']);
                return throwError(() => err);
            }),
            finalize(() => {
                this.isRefreshing = false;
            })
        );
    }
}
