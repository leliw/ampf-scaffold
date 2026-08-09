import { CommonModule, Location } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { ItemService } from '../item.service';

@Component({
  selector: 'app-item-edit',
  imports: [
    CommonModule,
    FormField,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,

  ],
  templateUrl: './item-edit.html',
  styleUrl: './item-edit.scss',
})
export class ItemEdit {
  itemId = input.required<string>();

  private itemService = inject(ItemService);

  resource = rxResource({
    params: () => {
      const itemId = this.itemId();
      return itemId != "__NEW__" ? ({ itemId: itemId }) : undefined;
    },
    stream: ({ params }) => this.itemService.get(params.itemId)
  });
  originalModel = linkedSignal(() => this.resource.value() ?? this.itemService.new());
  model = linkedSignal(() => structuredClone(this.originalModel()));
  form = form(this.model, (s) => {
    required(s.title, { message: 'Title is required' });
    required(s.content, { message: 'Content is required' });
  });

  location = inject(Location);
  snackBar = inject(MatSnackBar);

  isCreateMode = computed(() => this.itemId() === '__NEW__');
  isLoading = linkedSignal(() => this.resource.isLoading());
  isSaving = signal(false);
  isBusy = computed(() => this.isLoading() || this.isSaving());
  canSubmit = computed(() =>
    !this.isLoading() &&
    !this.isSaving() &&
    this.form().dirty() &&
    !this.form().invalid()
  );

  submit(event: Event) {
    event.preventDefault();
    this.isSaving.set(true);
    const request$ = this.isCreateMode()
      ? this.itemService.create(this.model())
      : this.itemService.update(this.itemId(), this.model());

    request$.pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        this.snackBar.open('Updated successfully!', 'Close', { duration: 3000 });
        this.location.back();
      },
      error: error => {
        this.snackBar.open('Error updating.', 'Close', { duration: 3000 });
        console.error('Error updating:', error);
      }
    });
  }

  cancel(): void {
    this.location.back();
  }

  onClose(): void {
    this.location.back();
  }

}

