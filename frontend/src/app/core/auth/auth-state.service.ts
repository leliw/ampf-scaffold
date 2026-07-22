import { Injectable, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Tokens } from './auth.service';


export interface User {
    username: string;
    email: string;
    picture?: string;
}

interface DecodedToken {
    sub: string;
    email: string;
    picture?: string;
    roles?: string[];
}

@Injectable({
    providedIn: 'root',
})
export class AuthStateService {
    // Signals – source of truth
    private readonly _isAuthenticated = signal<boolean>(false);
    private readonly _user = signal<User | null>(null);
    private readonly _roles = signal<string[]>([]);

    // Public API (readonly)
    readonly isAuthenticated = this._isAuthenticated.asReadonly();
    readonly user = this._user.asReadonly();
    readonly roles = this._roles.asReadonly();

    setUserData(tokens: Tokens): void {
        try {
            const payload = jwtDecode<DecodedToken>(tokens.access_token);

            this._user.set({
                username: payload.sub,
                email: payload.email,
                picture: payload.picture,
            });

            this._roles.set(payload.roles || []);
            this._isAuthenticated.set(true);
        } catch (error) {
            console.error('Failed to decode JWT token:', error);
            this.clear();
        }
    }

    clear(): void {
        this._user.set(null);
        this._roles.set([]);
        this._isAuthenticated.set(false);
    }

    getCurrentUser(): User | null {
        return this._user();
    }

    getRoles(): string[] {
        return this._roles();
    }

    hasRole(requiredRole: string): boolean {
        return this._roles().includes(requiredRole);
    }
    hasAnyRole(requiredRoles: string[]): boolean {
        return requiredRoles.some(role => this._roles().includes(role));
    }
    hasAllRoles(requiredRoles: string[]): boolean {
        return requiredRoles.every(role => this._roles().includes(role));
    }
}
