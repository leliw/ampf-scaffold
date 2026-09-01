import { Location } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, finalize, throwError } from 'rxjs';
import { ItemService } from '../item.service';

@Component({
  selector: 'app-item-edit',
  imports: [
    FormField,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,

  ],
  templateUrl: './item-edit.html',
  styleUrl: './item-edit.scss',
})
export class ItemEdit {
  itemId = input.required<string>();

  private itemService = inject(ItemService);
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);

  resource = rxResource({
    params: () => {
      const itemId = this.itemId();
      return itemId !== "__NEW__" ? ({ itemId }) : undefined;
    },
    stream: ({ params }) => this.itemService.get(params.itemId).pipe(
      catchError((error) => {
        console.error('Failed to load item:', error);
        this.snackBar.open('Failed to load item.', 'Close', { duration: 5000 });
        this.cancel();
        return throwError(() => error);
      })
    ),
  });
  originalModel = linkedSignal(() => this.resource.value() ?? this.itemService.new());
  model = linkedSignal(() => structuredClone(this.originalModel()));
  form = form(this.model, (s) => {
    required(s.title, { message: 'Title is required' });
    required(s.content, { message: 'Content is required' });
  });


  isCreateMode = computed(() => this.itemId() === '__NEW__');
  isLoading = computed(() => this.resource.isLoading());
  isSaving = signal(false);
  isBusy = computed(() => this.isLoading() || this.isSaving());
  hasLoadError = computed(() => !!this.resource.error());
  canSubmit = computed(() =>
    !this.isBusy() &&
    !this.hasLoadError() &&
    this.form().dirty() &&
    this.form().valid()
  );

  submit(event: Event) {
    event.preventDefault();
    if (!this.canSubmit()) {
      return;
    }
    this.isSaving.set(true);
    const request$ = this.isCreateMode()
      ? this.itemService.create(this.model())
      : this.itemService.update(this.itemId(), this.model());

    request$.pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        this.snackBar.open('Saved successfully!', 'Close', { duration: 3000 });
        this.location.back();
      },
      error: error => {
        this.snackBar.open('Error saving.', 'Close', { duration: 3000 });
        console.error('Error saving:', error);
      }
    });
  }

  cancel(): void {
    this.location.back();
  }

}

