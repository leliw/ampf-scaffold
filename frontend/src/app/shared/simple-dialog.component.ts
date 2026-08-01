import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';


export interface DialogData {
    title: string;
    message: string;
    confirm: boolean;
}

@Component({
    selector: 'app-simple-dialog',
    imports: [MatDialogModule, MatButtonModule],
    template: `
        <h2 mat-dialog-title>{{ data.title }}</h2>
        <mat-dialog-content>
            <p [innerHTML]="data.message"></p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            @if(data.confirm) {
            <button mat-raised-button color="warn" (click)="onCancel()" cdkFocusInitial>No</button>
            <button mat-raised-button color="primary" (click)="onConfirm()">Yes</button>
            } @else {
            <button mat-raised-button color="primary" (click)="onCancel()" cdkFocusInitial>OK</button>
            }
        </mat-dialog-actions>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
})
export class SimpleDialogComponent {

    constructor(
        public dialogRef: MatDialogRef<SimpleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) { }

    onConfirm(): void {
        this.dialogRef.close(true);
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

}
