import { Injectable, Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface LoaderConfig {
  message?: string;
}

@Component({
  selector: 'app-fullscreen-loader',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="fullscreen-loader">
      <mat-spinner diameter="64" color="accent"></mat-spinner>
      <p class="message">
        {{ data.message }}
      </p>
    </div>
  `,
  styles: [`
    .fullscreen-loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.35);
      color: white;
      gap: 32px;
      text-align: center;

      .message {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 500;
        opacity: 0.9;
        letter-spacing: 0.5px;
      }
    }
  `],
})
export class FullscreenLoaderComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { message?: string }
  ) { }
}

@Injectable({
  providedIn: 'root',
})
export class FullscreenLoaderService {
  private dialogRef: MatDialogRef<FullscreenLoaderComponent> | null = null;

  constructor(private dialog: MatDialog) { }

  show(config: LoaderConfig = {}): void {
    if (this.dialogRef) {
      this.dialogRef.componentInstance.data = { message: config.message };
      return;
    }

    this.dialogRef = this.dialog.open(FullscreenLoaderComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: ['fullscreen-dialog'],
      disableClose: true,
      hasBackdrop: false,
      data: { message: config.message || 'Wait please...' }
    });
  }

  hide(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }

  isVisible(): boolean {
    return !!this.dialogRef;
  }
}
