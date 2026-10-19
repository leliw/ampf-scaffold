import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, inject, input, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTableDataSourceClientSide } from '../mat-table-data-source-client-side';
import { SimpleDialogComponent } from '../simple-dialog.component';
import { ColumnDefinition, TableDefinitionService } from './table-definition.service';

@Component({
    selector: 'app-dynamic-table-client-side',
    imports: [
        CommonModule,
        RouterModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './dynamic-table-client-side.html',
    styleUrl: './dynamic-table-client-side.scss',
})
export class DynamicTableClientSide {
    crudName = input.required<string>();

    private definitionService = inject(TableDefinitionService)

    private http = inject(HttpClient);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private dialog = inject(MatDialog);
    private snackbar = inject(MatSnackBar);

    readonly table = viewChild(MatTable<any>);
    readonly paginator = viewChild(MatPaginator);
    readonly sort = viewChild(MatSort);


    definition_resource = this.definitionService.getResource(this.crudName);
    columns = computed(() => this.definition_resource.value()?.columns ?? []);
    actions = computed(() => this.definition_resource.value()?.actions ?? []);
    displayedColumns = computed(() => {
        const columns = this.columns() ?? [];
        const actions = this.actions() ?? [];
        if (actions.length > 0 && !(actions.length === 1 && actions[0] === 'add')) {
            return [...columns.map(column => column.key), 'actions'];
        } else {
            return [...columns.map(column => column.key)];
        }
    });

    dataSource: MatTableDataSourceClientSide<any> = new MatTableDataSourceClientSide<any>();

    constructor() {
        effect(() => {
            const crudName = this.crudName();
            this.dataSource.getData = () => this.http.get<any[]>(`/api/${encodeURIComponent(crudName)}`, { observe: 'response', });
            this.dataSource.refresh();
        });

        effect(onCleanup => {
            const paginator = this.paginator();
            const sort = this.sort();
            if (!paginator || !sort) return;
            const subscription = this.dataSource.setPaginatorAndSortPipe(paginator, sort).subscribe();
            onCleanup(() => subscription.unsubscribe());
        });
    }

    getCellValue(row: any, column: ColumnDefinition): string | number {
        return row[column.key];
    }

    onClickRow(row: any): void {
        if (this.actions().includes('view')) {
            this.viewRow(row);
        } else if (this.actions().includes('edit')) {
            this.editRow(row);
        }
    }

    viewRow(row: any): void {
        this.router.navigate([row.id, 'view'], { relativeTo: this.route });
    }
    editRow(row: any): void {
        this.router.navigate([row.id, 'edit'], { relativeTo: this.route });
    }

    deleteRow(row: any): void {
        this.dialog
            .open(SimpleDialogComponent, {
                data: {
                    title: 'Delete item',
                    message: `Are you sure you want to delete item "<b>${row.title}</b>"?`,
                    confirm: true
                }
            })
            .afterClosed().subscribe(result => {
                if (result && row.id) {
                    this.http.delete<void>(`/api/${encodeURIComponent(this.crudName())}/${encodeURIComponent(row.id)}`).subscribe({
                        next: () => {
                            this.dataSource.data = this.dataSource.data.filter(item => item.id !== row.id);
                            this.table()?.renderRows();
                            this.snackbar.open(`Item "${row.title}" deleted successfully`, 'Close', { duration: 1500 });
                        },
                        error: (error) => {
                            this.snackbar.open(`Error deleting item "${row.title}": ${error.message}`, 'Close', { duration: 3000 });
                        }
                    });
                }
            });
    }
}
