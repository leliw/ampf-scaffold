import { Location } from '@angular/common';
import { Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { getChangedData, removeEmptyValues } from '../../../shared/utils/signal-form.util';
import { ItemCreate, ItemService } from '../item.service';

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

    private location = inject(Location);
    private snackBar = inject(MatSnackBar);
    private service = inject(ItemService);

    resource = this.service.getResource(this.itemId);
    model = linkedSignal(() => structuredClone(this.resource.value()));
    form = form(this.model, (s) => {
        required(s.title, { message: 'Title is required' });
        required(s.content, { message: 'Content is required' });
    });

    isCreateMode = computed(() => this.itemId() === '__NEW__');
    isLoading = computed(() => this.resource.isLoading());
    isSaving = signal(false);
    isBusy = computed(() => this.isLoading() || this.isSaving());
    canSubmit = computed(() =>
        !this.isLoading() &&
        !this.isSaving() &&
        this.form().dirty() &&
        !this.form().invalid()
    );

    constructor() {
        effect(() => {
            if (this.resource.error()) {
                this.snackBar.open('Loading error occurred.', 'Close', { duration: 5000 })
                    .afterDismissed().subscribe(() => this.cancel());
            }
        });
    }

    submit(event: Event) {
        event.preventDefault();
        if (!this.canSubmit()) return;
        this.isSaving.set(true);
        const request$ = this.isCreateMode()
            ? this.service.create(removeEmptyValues(this.model()) as ItemCreate)
            : this.service.update(this.itemId(), getChangedData(this.resource.value(), this.model()));

        request$.pipe(
            finalize(() => this.isSaving.set(false))
        ).subscribe({
            next: () => {
                const msg = this.isCreateMode() ? 'Created successfully!' : 'Updated successfully!';
                this.snackBar.open(msg, 'Close', { duration: 3000 });
                this.location.back();
            },
            error: error => {
                const msg = this.isCreateMode() ? 'Error creating.' : 'Error updating.';
                this.snackBar.open(msg, 'Close', { duration: 3000 });
                console.error(msg, error);
            }
        });
    }

    cancel(): void {
        this.location.back();
    }

}

