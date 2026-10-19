import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface User {
    username: string;
    email: string;
    name: string;
    disabled: boolean;
    roles: string[];
    picture?: string | null;
    password?: string | null; // Only for creation/update, not typically returned
}

export interface UserHeader {
    username: string;
    email?: string | null;
    name?: string | null;
    disabled?: boolean;
    roles?: string[];
    picture?: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    public readonly endpoint = '/api/users';

    private readonly http = inject(HttpClient);

    new(): User {
        return {
            username: '',
            email: '',
            name: '',
            disabled: false,
            roles: [],
            password: '',
        };
    }

    getHeaders(ids?: string[]): Observable<UserHeader[]> {
        return this.http.get<UserHeader[]>(this.endpoint, {
            params: ids === undefined ? undefined : { ids },
        });
    }

    getHeadersResource(ids?: Signal<string[]>): HttpResourceRef<UserHeader[]> {
        return httpResource<UserHeader[]>(
            () => {
                const values = ids?.();

                if (values === undefined) {
                    return { url: this.endpoint };
                }

                return values.length === 0
                    ? undefined
                    : { url: this.endpoint, params: { ids: values } };
            },
            { defaultValue: [] },
        );
    }

    create(body: User): Observable<User> {
        return this.http.post<User>(this.endpoint, body);
    }

    get(username: string): Observable<User> {
        return this.http.get<User>(`${this.endpoint}/${username}`);
    }

    update(username: string, body: User): Observable<User> {
        return this.http.put<User>(`${this.endpoint}/${username}`, body);
    }

    changePassword(username: string, password: string): Observable<void> {
        return this.http.patch<void>(`${this.endpoint}/${username}/change-password`, { password: password });
    }

    delete(username: string): Observable<void> {
        return this.http.delete<void>(`${this.endpoint}/${username}`);
    }
}
