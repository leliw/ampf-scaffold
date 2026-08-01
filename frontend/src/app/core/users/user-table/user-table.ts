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
import { NavigationBar } from "../../navigation-bar/navigation-bar";
import { UserHeader, UserService } from '../user.service';

@Component({
  selector: 'app-user-table',
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
  templateUrl: './user-table.html',
  styleUrl: './user-table.scss',
})
export class UserTable implements AfterViewInit {
  @ViewChild(MatTable) table!: MatTable<UserHeader>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource: MatTableDataSourceClientSide<UserHeader>;
  displayedColumns: string[] = ['username', 'email', 'name', 'disabled', 'roles', 'actions'];
  currentUsername: string | undefined;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private userService: UserService,
  ) {
    this.dataSource = new MatTableDataSourceClientSide<UserHeader>(this.userService.endpoint);
    // this.currentUsername = authService.username;

  }

  ngAfterViewInit(): void {
    this.dataSource.setPaginatorAndSort(this.paginator, this.sort);
  }

  onClickRow(row: UserHeader): void {
    this.editRow(row);
  }

  editRow(row: UserHeader): void {
    this.router.navigate(['/users', row.username]);
  }

  changePasswordRow(row: UserHeader): void {
    this.router.navigate(['/users', row.username, 'change-password']);
  }

  deleteRow(row: UserHeader): void {
    this.dialog
      .open(SimpleDialogComponent, {
        data: {
          title: 'Delete user',
          message: `Are you sure you want to delete user "<b>${row.username}</b>"?`,
          confirm: true
        }
      })
      .afterClosed().subscribe(result => {
        if (result && row.username)
          this.userService.delete(row.username).subscribe({
            next: () => {
              this.dataSource.data = this.dataSource.data.filter(item => item.username !== row.username);
              this.table.renderRows();
              this.snackbar.open(`User "${row.username}" deleted successfully`, 'Close', { duration: 1500 });
            },
            error: (error) => {
              this.snackbar.open(`Error deleting user "${row.username}": ${error.message}`, 'Close', { duration: 3000 });
            }
          });
      });
  }
}
