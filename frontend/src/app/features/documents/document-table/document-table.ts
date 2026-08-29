import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
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
    dataSource = new MatTableDataSourceClientSide<Document>;

    displayedColumns: string[] = [
        'name',
        'content_type',
        'keywords',
        'src_url',
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
        this.dataSource.setPaginatorAndSort(this.paginator, this.sort);
    }

    onClickRow(row: Document): void {
        this.editRow(row);
    }

    editRow(row: Document): void {
        this.router.navigate(['/documents', row.id]);
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
                    this.documentService.delete(row.id).subscribe({
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
