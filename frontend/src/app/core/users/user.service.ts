import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface User {
    username: string;
    email?: string | null;
    name?: string | null;
    disabled?: boolean;
    roles?: string[];
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

    constructor(private httpClient: HttpClient) { }

    getAll(): Observable<UserHeader[]> {
        return this.httpClient.get<UserHeader[]>(this.endpoint);
    }

    create(body: User): Observable<User> {
        return this.httpClient.post<User>(this.endpoint, body);
    }

    get(username: string): Observable<User> {
        return this.httpClient.get<User>(`${this.endpoint}/${username}`);
    }

    update(username: string, body: User): Observable<User> {
        return this.httpClient.put<User>(`${this.endpoint}/${username}`, body);
    }

    changePassword(username: string, password: string): Observable<void> {
        return this.httpClient.patch<void>(`${this.endpoint}/${username}/change-password`, { password: password });
    }

    delete(username: string): Observable<void> {
        return this.httpClient.delete<void>(`${this.endpoint}/${username}`);
    }
}
