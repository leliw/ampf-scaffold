import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { computed, inject, Service, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { mergeWithDefaults } from '../../shared/utils/signal-form.util';


export interface ItemCreate {
    title: string;
    content: string;
}


export interface ItemUpdate {
    title?: string;
    content?: string;
}

export interface ItemHeader {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface Item {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
}


@Service()
export class ItemService {
    private http = inject(HttpClient);

    public readonly endpoint = '/api/items';

    new() {
        return {
            title: '',
            content: '',
        }
    }

    getHeaders(ids?: string[]): Observable<ItemHeader[]> {
        return this.http.get<ItemHeader[]>(this.endpoint, {
            params: ids === undefined ? undefined : { ids },
        });
    }

    getHeadersResource(ids?: Signal<string[]>): HttpResourceRef<ItemHeader[]> {
        return httpResource<ItemHeader[]>(
            () => {
                const values = ids?.();

                if (values === undefined) {
                    return { url: this.endpoint }
                }

                return values.length === 0
                    ? undefined
                    : { url: this.endpoint, params: { ids: values } };
            },
            { defaultValue: [] },
        );
    }

    create(body: ItemCreate): Observable<Item> {
        return this.http.post<Item>(this.endpoint, body);
    }

    get(id: string): Observable<Item> {
        return this.http.get<Item>(
            `${this.endpoint}/${encodeURIComponent(id)}`,
        );
    }

    getResource(id: Signal<string>) {
        const resource = httpResource<Item>(() => {
            const value = id();
            return value === '__NEW__' ? undefined : `${this.endpoint}/${encodeURIComponent(value)}`;
        });
        return {
            isLoading: computed(() => resource.isLoading()),
            value: computed(() => (resource.hasValue()) ? mergeWithDefaults(this.new(), resource.value()) : this.new()),
            error: computed(() => resource.error()),
            hasValue: computed(() => resource.hasValue()),
        };
    }

    update(id: string, body: ItemUpdate): Observable<Item> {
        return this.http.patch<Item>(`${this.endpoint}/${encodeURIComponent(id)}`, body);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.endpoint}/${encodeURIComponent(id)}`);
    }
}
