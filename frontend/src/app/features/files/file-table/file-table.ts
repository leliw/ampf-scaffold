import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
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
import { RouterModule } from '@angular/router';
import { NavigationBar } from '../../../core/navigation-bar/navigation-bar';
import { MatTableDataSourceClientSide } from '../../../shared/mat-table-data-source-client-side';
import { SimpleDialogComponent } from '../../../shared/simple-dialog.component';
import { BlobHeader, FileService } from '../file.service';

@Component({
  selector: 'app-file-table',
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
  templateUrl: './file-table.html',
  styleUrl: './file-table.scss',
})
export class FileTable implements AfterViewInit {
  @ViewChild(MatTable) table!: MatTable<BlobHeader>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  dataSource: MatTableDataSourceClientSide<BlobHeader>;
  displayedColumns: string[] = ['name', 'filename', 'content_type', 'actions'];

  constructor(
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private fileService: FileService,
  ) {
    this.dataSource = new MatTableDataSourceClientSide<BlobHeader>(this.fileService.endpoint);
  }

  ngAfterViewInit(): void {
    this.dataSource.setPaginatorAndSort(this.paginator, this.sort);
  }

  downloadFile(row: BlobHeader): void {
    this.fileService.download(row.name).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = row.metadata?.filename || row.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.snackbar.open(`Error downloading file "${row.name}": ${error.message}`, 'Close', { duration: 3000 });
      },
    });
  }

  triggerUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.fileService.upload(file, file.name).subscribe({
        next: (header: BlobHeader) => {
          this.dataSource.data = [...this.dataSource.data, header];
          this.table?.renderRows();
          this.snackbar.open(`File "${file.name}" uploaded successfully`, 'Close', { duration: 1500 });
          target.value = '';
        },
        error: (error) => {
          this.snackbar.open(`Error uploading file "${file.name}": ${error.message}`, 'Close', { duration: 3000 });
          target.value = '';
        },
      });
    }
  }

  deleteRow(row: BlobHeader): void {
    this.dialog
      .open(SimpleDialogComponent, {
        data: {
          title: 'Delete file',
          message: `Are you sure you want to delete file "<b>${row.name}</b>"?`,
          confirm: true,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result && row.name) {
          this.fileService.delete(row.name).subscribe({
            next: () => {
              this.dataSource.data = this.dataSource.data.filter((item) => item.name !== row.name);
              this.table.renderRows();
              this.snackbar.open(`File "${row.name}" deleted successfully`, 'Close', { duration: 1500 });
            },
            error: (error) => {
              this.snackbar.open(`Error deleting file "${row.name}": ${error.message}`, 'Close', { duration: 3000 });
            },
          });
        }
      });
  }
}
