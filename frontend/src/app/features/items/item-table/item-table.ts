import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSourceClientSide } from '../../../shared/mat-table-data-source-client-side';
import { SimpleDialogComponent } from '../../../shared/simple-dialog.component';
import { NavigationBar } from "../../../core/navigation-bar/navigation-bar";
import { ItemHeader, ItemService } from '../item.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, switchMap, takeWhile, timer } from 'rxjs';

@Component({
    selector: 'app-item-table',
    imports: [
        CommonModule,
        RouterModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        NavigationBar,
    ],
    templateUrl: './item-table.html',
    styleUrl: './item-table.scss',
})
export class ItemTable implements AfterViewInit {
    @ViewChild(MatTable) table!: MatTable<ItemHeader>;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    dataSource: MatTableDataSourceClientSide<ItemHeader>;

    displayedColumns: string[] = ['id', 'title', 'status', 'created_at', 'updated_at', 'actions'];

    private destroyRef = inject(DestroyRef);
    private isPolling = false;

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private snackbar: MatSnackBar,
        private itemService: ItemService,
    ) {
        this.dataSource = new MatTableDataSourceClientSide<ItemHeader>(this.itemService.endpoint);
    }

    ngAfterViewInit(): void {
        this.dataSource.setPaginatorAndSortPipe(this.paginator, this.sort)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.startPollingIfPending());
    }

    isPending(status?: string): boolean {
        return status === 'RUNNING' || status === 'PENDING';
    }

    private startPollingIfPending(): void {
        if (this.isPolling) return;

        const pendingRows = this.dataSource.data.filter((doc) => this.isPending(doc.status) && !!doc.id);
        if (pendingRows.length === 0) return;

        this.isPolling = true;

        timer(0, 2000)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                switchMap(() => {
                    const pendingIds = this.dataSource.data
                        .filter((doc) => this.isPending(doc.status) && !!doc.id)
                        .map((doc) => doc.id!);

                    if (pendingIds.length === 0) {
                        return of([] as ItemHeader[]);
                    }

                    return this.itemService.getByIds(pendingIds);
                }),
                takeWhile((results) => {
                    if (results.length === 0) {
                        this.isPolling = false;
                        return false;
                    }
                    return true;
                }, true)
            )
            .subscribe({
                next: (updatedRows) => {
                    if (!updatedRows || updatedRows.length === 0) return;

                    for (const row of updatedRows) {
                        const previousDoc = this.dataSource.data.find((d) => d.id === row.id);
                        const wasPending = previousDoc && this.isPending(previousDoc.status);

                        if (wasPending && !this.isPending(row.status)) {
                            if (row.status === 'COMPLETED' || row.status === 'SUCCESS') {
                                this.snackbar.open(`Conversion of "${row.title}" completed successfully!`, 'Close', { duration: 3000 });
                            } else if (row.status === 'FAILED' || row.status === 'ERROR') {
                                this.snackbar.open(`Conversion of "${row.title}" failed: ${row.error_message || 'Unknown error'}`, 'Close', { duration: 4000 });
                            }
                        }

                        this.updateRowInTable(row);
                    }
                },
                error: (err) => {
                    console.error('Error during polling:', err);
                    this.isPolling = false;
                },
            });
    }

    private updateRowInTable(updatedRow: ItemHeader): void {
        this.dataSource.data = this.dataSource.data.map(item =>
            item.id === updatedRow.id ? { ...item, ...updatedRow } : item
        );
        this.table?.renderRows();
    }

    onClickRow(row: ItemHeader): void {
        this.editRow(row);
    }

    editRow(row: ItemHeader): void {
        this.router.navigate(['/items', row.id]);
    }

    deleteRow(row: ItemHeader): void {
        this.dialog
            .open(SimpleDialogComponent, {
                data: {
                    title: 'Delete item',
                    message: `Are you sure you want to delete item "<b>${row.title}</b>"?`,
                    confirm: true
                }
            })
            .afterClosed().subscribe(result => {
                if (result && row.id)
                    this.itemService.delete(row.id).subscribe({
                        next: () => {
                            this.dataSource.data = this.dataSource.data.filter(item => item.id !== row.id);
                            this.table.renderRows();
                            this.snackbar.open(`Item "${row.title}" deleted successfully`, 'Close', { duration: 1500 });
                        },
                        error: (error) => {
                            this.snackbar.open(`Error deleting item "${row.title}": ${error.message}`, 'Close', { duration: 3000 });
                        }
                    });
            });
    }
}
