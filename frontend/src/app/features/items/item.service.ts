import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

export interface Item {
    id?: string;
    title: string;
    status?: string;
    error_message?: string;
    content: string;
    created_at?: string;
    updated_at?: string;
}

export interface ItemHeader {
    id: string;
    title: string;
    status?: string;
    error_message?: string;
    created_at: string;
    updated_at: string;
}

@Service()
export class ItemService {
    private http = inject(HttpClient);

    public readonly endpoint = '/api/items';

    constructor() { }

    new(): Item {
        return {
            title: '',
            content: '',
        }
    }

    getAll(): Observable<ItemHeader[]> {
        return this.http.get<ItemHeader[]>(this.endpoint);
    }

    getByIds(ids: string[]): Observable<ItemHeader[]> {
        return this.http.get<ItemHeader[]>(this.endpoint, { params: { ids } });
    }

    create(body: Item): Observable<Item> {
        return this.http.post<Item>(this.endpoint, body);
    }

    get(itemId: string): Observable<Item> {
        return this.http.get<Item>(`${this.endpoint}/${itemId}`);
    }

    update(itemId: string, body: Item): Observable<Item> {
        return this.http.put<Item>(`${this.endpoint}/${itemId}`, body);
    }

    delete(itemId: string): Observable<void> {
        return this.http.delete<void>(`${this.endpoint}/${itemId}`);
    }
}
