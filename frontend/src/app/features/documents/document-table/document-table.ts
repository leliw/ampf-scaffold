import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, inject, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
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
import { of, switchMap, takeWhile, timer } from 'rxjs';
import { NavigationBar } from '../../../core/navigation-bar/navigation-bar';
import { MatTableDataSourceClientSide } from '../../../shared/mat-table-data-source-client-side';
import { SimpleDialogComponent } from '../../../shared/simple-dialog.component';
import { Document, DocumentService } from '../document.service';

@Component({
    selector: 'app-document-table',
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
        MatChipsModule,
    ],
    templateUrl: './document-table.html',
    styleUrls: ['./document-table.scss'],
})
export class DocumentTable implements AfterViewInit {
    @ViewChild(MatTable) table!: MatTable<Document>;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    private destroyRef = inject(DestroyRef);
    private isPolling = false;

    dataSource = new MatTableDataSourceClientSide<Document>;

    displayedColumns: string[] = [
        'name',
        'content_type',
        'keywords',
        'src_url',
        'status',
        'created_at',
        'updated_at',
        'actions',
    ];

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private snackbar: MatSnackBar,
        private documentService: DocumentService,
    ) {
        this.dataSource = new MatTableDataSourceClientSide<Document>(this.documentService.endpoint);
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

        // Sprawdź czy są jakiekolwiek dokumenty w toku
        const pendingDocs = this.dataSource.data.filter((doc) => this.isPending(doc.status) && !!doc.id);
        if (pendingDocs.length === 0) return;

        this.isPolling = true;

        timer(0, 2000)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                switchMap(() => {
                    // Pobieramy TYLKO ID tych, które aktualnie są w trakcie przetwarzania
                    const pendingIds = this.dataSource.data
                        .filter((doc) => this.isPending(doc.status) && !!doc.id)
                        .map((doc) => doc.id!);

                    if (pendingIds.length === 0) {
                        return of([] as Document[]);
                    }

                    // Odpytujemy równolegle TYLKO aktywne dokumenty
                    return this.documentService.getByIds(pendingIds);
                }),
                // Timer działa dopóki w ostatniej iteracji były jakieś aktywne dokumenty
                takeWhile((results) => {
                    if (results.length === 0) {
                        this.isPolling = false;
                        return false;
                    }
                    return true;
                }, true)
            )
            .subscribe({
                next: (updatedDocs) => {
                    if (!updatedDocs || updatedDocs.length === 0) return;

                    // Aktualizuj tylko zmienione wiersze i wyświetl SnackBar przy sukcesie/błędzie
                    for (const doc of updatedDocs) {
                        const previousDoc = this.dataSource.data.find((d) => d.id === doc.id);
                        const wasPending = previousDoc && this.isPending(previousDoc.status);

                        if (wasPending && !this.isPending(doc.status)) {
                            if (doc.status === 'COMPLETED' || doc.status === 'SUCCESS') {
                                this.snackbar.open(`Conversion of "${doc.name}" completed successfully!`, 'Close', { duration: 3000 });
                            } else if (doc.status === 'FAILED' || doc.status === 'ERROR') {
                                this.snackbar.open(`Conversion of "${doc.name}" failed: ${doc.error_message || 'Unknown error'}`, 'Close', { duration: 4000 });
                            }
                        }

                        this.updateDocumentInTable(doc);
                    }
                },
                error: (err) => {
                    console.error('Error during polling:', err);
                    this.isPolling = false;
                },
            });
    }
    onClickRow(row: Document): void {
        this.editRow(row);
    }

    editRow(row: Document): void {
        this.router.navigate(['/documents', row.id]);
    }

    convertDocument(doc: Document): void {
        if (!doc.id) return;

        this.documentService.convertToMd(doc.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.updateDocumentInTable({ ...doc, status: 'RUNNING' });
                    this.snackbar.open(`Document "${doc.name}" conversion started`, 'Close', { duration: 2000 });
                },
                error: (err) => {
                    console.error('Error starting conversion:', err);
                    this.snackbar.open('Error starting document conversion.', 'Close', {
                        duration: 3000,
                    });
                },
            });
    }

    private updateDocumentInTable(updatedDoc: Document): void {
        this.dataSource.data = this.dataSource.data.map(item =>
            item.id === updatedDoc.id ? { ...item, ...updatedDoc } : item
        );
        this.table?.renderRows();
    }

    downloadDocument(doc: Document): void {
        if (!doc.id) return;

        this.documentService.downloadContent(doc.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = window.document.createElement('a');
                a.href = url;
                a.download = doc.name || 'document';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                console.error('Error downloading file:', err);
                this.snackbar.open('Error downloading file.', 'Close', {
                    duration: 3000,
                });
            },
        });
    }


    deleteRow(row: Document): void {
        this.dialog
            .open(SimpleDialogComponent, {
                data: {
                    title: 'Delete item',
                    message: `Are you sure you want to delete document "<b>${row.name}</b>"?`,
                    confirm: true
                }
            })
            .afterClosed().subscribe(result => {
                if (result && row.id) {
                    this.documentService.delete(row.id)
                        .pipe(takeUntilDestroyed(this.destroyRef))
                        .subscribe({
                            next: () => {
                                this.dataSource.data = this.dataSource.data.filter(item => item.id !== row.id);
                                this.table.renderRows();
                                this.snackbar.open(`Document "${row.name}" deleted successfully`, 'Close', { duration: 1500 });
                            },
                            error: (error) => {
                                this.snackbar.open(`Error deleting document "${row.name}": ${error.message}`, 'Close', { duration: 3000 });
                            }
                        });
                }
            });
    }
}
