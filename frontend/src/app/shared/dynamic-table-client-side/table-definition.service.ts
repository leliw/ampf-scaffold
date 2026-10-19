import { HttpClient, httpResource, HttpResourceRef } from "@angular/common/http";
import { inject, Service, Signal } from "@angular/core";
import { Observable } from "rxjs";

export type ColumnFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'url';

export interface ColumnDefinition {
    key: string;
    label: string;
    type: ColumnFieldType;
    sortable: boolean;
}

export interface TableDefinition {
    actions: string[];
    columns: ColumnDefinition[];
}

@Service()
export class TableDefinitionService {
    private readonly http = inject(HttpClient);
    private readonly endpoint = '/api';

    get(name: string): Observable<TableDefinition> {
        return this.http.get<TableDefinition>(`${this.endpoint}/${encodeURIComponent(name)}/definition/table`);
    }

    getResource(name: Signal<string>): HttpResourceRef<TableDefinition | undefined> {
        return httpResource<TableDefinition>(() => `${this.endpoint}/${encodeURIComponent(name())}/definition/table`);
    }
}
