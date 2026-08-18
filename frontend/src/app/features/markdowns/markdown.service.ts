import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

export interface Markdown {
    id?: string;
    title: string;
    content: string;
    created_at?: string;
    updated_at?: string;
}

export interface MarkdownHeader {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

@Service()
export class MarkdownService {
    private http = inject(HttpClient);

    public readonly endpoint = '/api/markdowns';

    constructor() { }

    new(): Markdown {
        return {
            title: '',
            content: '',
        }
    }

    getAll(): Observable<MarkdownHeader[]> {
        return this.http.get<MarkdownHeader[]>(this.endpoint);
    }

    create(body: Markdown): Observable<Markdown> {
        return this.http.post<Markdown>(this.endpoint, body);
    }

    get(markdownId: string): Observable<Markdown> {
        return this.http.get<Markdown>(`${this.endpoint}/${markdownId}`);
    }

    update(markdownId: string, body: Markdown): Observable<Markdown> {
        return this.http.put<Markdown>(`${this.endpoint}/${markdownId}`, body);
    }

    delete(markdownId: string): Observable<void> {
        return this.http.delete<void>(`${this.endpoint}/${markdownId}`);
    }
}
