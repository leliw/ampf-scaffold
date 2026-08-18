import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

export interface Item {
    id?: string;
    title: string;
    content: string;
    created_at?: string;
    updated_at?: string;
}

export interface ItemHeader {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

@Service()
export class ItemService {
    private http = inject(HttpClient);

    public readonly endpoint = '/api/items';

    new(): Item {
        return {
            title: '',
            content: '',
        }
    }

    getAll(): Observable<ItemHeader[]> {
        return this.http.get<ItemHeader[]>(this.endpoint);
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
