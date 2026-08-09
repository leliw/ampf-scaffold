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
import { ItemHeader, ItemService } from '../item.service';

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
  displayedColumns: string[] = ['id', 'title', 'created_at', 'updated_at', 'actions'];

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private itemService: ItemService,
  ) {
    this.dataSource = new MatTableDataSourceClientSide<ItemHeader>(this.itemService.endpoint);
  }

  ngAfterViewInit(): void {
    this.dataSource.setPaginatorAndSort(this.paginator, this.sort);
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
