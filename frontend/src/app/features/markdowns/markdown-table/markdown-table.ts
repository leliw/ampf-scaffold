import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
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
import { MarkdownHeader, MarkdownService } from '../markdown.service';

@Component({
  selector: 'app-markdown-table',
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
  templateUrl: './markdown-table.html',
  styleUrl: './markdown-table.scss',
})
export class MarkdownTable implements AfterViewInit {
  @ViewChild(MatTable) table!: MatTable<MarkdownHeader>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource: MatTableDataSourceClientSide<MarkdownHeader>;
  displayedColumns: string[] = ['id', 'title', 'created_at', 'updated_at', 'actions'];

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private markdownService: MarkdownService,
  ) {
    this.dataSource = new MatTableDataSourceClientSide<MarkdownHeader>(this.markdownService.endpoint);
  }

  ngAfterViewInit(): void {
    this.dataSource.setPaginatorAndSort(this.paginator, this.sort);
  }

  onClickRow(row: MarkdownHeader): void {
    this.editRow(row);
  }

  editRow(row: MarkdownHeader): void {
    this.router.navigate(['/markdowns', row.id, 'edit']);
  }

  deleteRow(row: MarkdownHeader): void {
    this.dialog
      .open(SimpleDialogComponent, {
        data: {
          title: 'Delete markdown',
          message: `Are you sure you want to delete markdown "<b>${row.title}</b>"?`,
          confirm: true
        }
      })
      .afterClosed().subscribe(result => {
        if (result && row.id)
          this.markdownService.delete(row.id).subscribe({
            next: () => {
              this.dataSource.data = this.dataSource.data.filter(markdown => markdown.id !== row.id);
              this.table.renderRows();
              this.snackbar.open(`Markdown "${row.title}" deleted successfully`, 'Close', { duration: 1500 });
            },
            error: (error) => {
              this.snackbar.open(`Error deleting markdown "${row.title}": ${error.message}`, 'Close', { duration: 3000 });
            }
          });
      });
  }
}
