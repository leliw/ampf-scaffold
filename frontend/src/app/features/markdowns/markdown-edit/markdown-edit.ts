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
import { MarkdownService } from '../markdown.service';
import { MarkdownEditorComponent } from '../../../shared/markdown-editor/markdown-editor.component';

@Component({
  selector: 'app-markdown-edit',
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
    MarkdownEditorComponent,
  ],
  templateUrl: './markdown-edit.html',
  styleUrl: './markdown-edit.scss',
})
export class MarkdownEdit {
  markdownId = input.required<string>();

  private markdownService = inject(MarkdownService);

  resource = rxResource({
    params: () => {
      const markdownId = this.markdownId();
      return markdownId != "__NEW__" ? ({ markdownId: markdownId }) : undefined;
    },
    stream: ({ params }) => this.markdownService.get(params.markdownId)
  });
  originalModel = linkedSignal(() => this.resource.value() ?? this.markdownService.new());
  model = linkedSignal(() => structuredClone(this.originalModel()));
  form = form(this.model, (s) => {
    required(s.title, { message: 'Title is required' });
    required(s.content, { message: 'Content is required' });
  });

  location = inject(Location);
  snackBar = inject(MatSnackBar);

  isCreateMode = computed(() => this.markdownId() === '__NEW__');
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
      ? this.markdownService.create(this.model())
      : this.markdownService.update(this.markdownId(), this.model());

    request$.pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        const msg = this.isCreateMode() ? 'Created successfully!' : 'Updated successfully!';
        this.snackBar.open(msg , 'Close', { duration: 3000 });
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

  onClose(): void {
    this.location.back();
  }

}

