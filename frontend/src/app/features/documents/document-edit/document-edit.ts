import { DatePipe, Location } from '@angular/common';
import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { applyWhen, form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, Observable, of, switchMap, throwError } from 'rxjs';
import { FileUploadContainer } from '../../../shared/file-upload-container/file-upload-container';
import { KeywordsInput } from '../../../shared/keywords-input/keywords-input';
import { getChangedData } from '../../../shared/utils/signal-form.util';
import { DocumentCreate, DocumentPatch, DocumentService } from '../document.service';

interface DocumentFormModel {
  file: File | null;
  name: string;
  src_url: string;
  keywords: string[];
}

@Component({
  selector: 'app-document-edit',
  imports: [
    DatePipe,
    FormField,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    KeywordsInput,
    FileUploadContainer
  ],
  templateUrl: './document-edit.html',
  styleUrl: './document-edit.scss',
})
export class DocumentEdit {
  documentId = input.required<string>();

  private documentService = inject(DocumentService);
  private location = inject(Location);
  private snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  resource = rxResource({
    params: () => {
      const id = this.documentId();
      return id !== '__NEW__' ? { id } : undefined;
    },
    stream: ({ params }) =>
      this.documentService.get(params.id).pipe(
        catchError((error) => {
          console.error('Failed to load document:', error);
          this.snackBar.open('Failed to fetch document.', 'Close', { duration: 5000 });
          this.cancel();
          return throwError(() => error);
        })
      ),
  });

  isCreateMode = computed(() => this.documentId() === '__NEW__');

  originalModel = linkedSignal(() => {
    const raw = this.resource.value() ?? this.documentService.new();
    return {
      ...raw,
      file: null,
      src_url: raw.src_url ?? '',
      keywords: raw.keywords ?? [],
    } as DocumentFormModel;
  });
  model = linkedSignal(() => structuredClone(this.originalModel()));

  form = form(this.model, (s) => {
    required(s.name, { message: 'Document name is required' });
    applyWhen(s, () => this.isCreateMode(), (s) => {
      required(s.file, { message: 'Document file is required' });
    });
  });

  isLoading = computed(() => this.resource.isLoading());
  isSaving = signal(false);
  uploadProgress = signal<number>(0);
  isBusy = computed(() => this.isLoading() || this.isSaving());
  hasLoadError = computed(() => !!this.resource.error());

  canSubmit = computed(() =>
    !this.isBusy() &&
    !this.hasLoadError() &&
    this.form().valid() &&
    this.form().dirty()
  );

  onFileSelected(file: File | null): void {
    this.model.update((m) => ({ ...m, file, name: file && !m.name ? file.name : m.name, }));
    this.form().markAsDirty();
  }

  submit(event: Event): void {
    event.preventDefault();
    if (!this.canSubmit()) return;

    this.isSaving.set(true);

    if (this.isCreateMode()) {
      const file = this.model().file as File;
      const payload: DocumentCreate = {
        name: this.model().name,
        src_url: this.model().src_url || undefined,
        keywords: this.model().keywords || [],
      };

      this.documentService.create(file, payload).pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => { this.isSaving.set(false); this.uploadProgress.set(0); })
      ).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress.set(Math.round((event.loaded / (event.total ?? 1)) * 100));
          } else if (event.type === HttpEventType.Response) {
            this.snackBar.open('Document uploaded successfully!', 'Close', { duration: 3000 });
            this.location.back();
          }
        },
        error: (error) => {
          this.snackBar.open('Error creating document.', 'Close', { duration: 3000 });
          console.error('Error creating document:', error);
        },
      });
    } else {
      const changes = getChangedData(this.originalModel(), this.model());
      const { file, ...metadataChanges } = changes;
      const docId = this.documentId();
      const hasMetadataChanges = Object.keys(metadataChanges).length > 0;
      const updateMetadata$: Observable<unknown> = hasMetadataChanges
        ? this.documentService.update(docId, metadataChanges as DocumentPatch)
        : of(null);
      const updateFile$: Observable<HttpEvent<void>> = file ? this.documentService.updateContent(docId, file) : of(new HttpResponse({ status: 200, body: null }));

      updateMetadata$.pipe(
        switchMap(() => updateFile$),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => { this.isSaving.set(false), this.uploadProgress.set(0); })
      ).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress.set(Math.round((event.loaded / (event.total ?? 1)) * 100));
          } else if (event.type === HttpEventType.Response) {
            this.snackBar.open('Document updated successfully!', 'Close', { duration: 3000 });
            this.location.back();
          }
        },

        error: (error) => {
          this.snackBar.open('Error saving document.', 'Close', { duration: 3000 });
          console.error('Error updating document:', error);
        },
      });
    }
  }

  cancel(): void {
    this.location.back();
  }
}
