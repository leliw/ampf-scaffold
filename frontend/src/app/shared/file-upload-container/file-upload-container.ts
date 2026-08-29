import { Component, ElementRef, forwardRef, input, signal, computed, viewChild, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * FileUploadContainer is a reusable Angular component that provides a user interface for file uploads. It allows users to select files either by clicking a button or by dragging and dropping files into the designated area. The component supports file type validation based on the provided accept attribute and displays upload progress and error messages.
 *
 * Features:
 * - File selection via button click or drag-and-drop.
 * - File type validation based on the accept attribute.
 * - Displays upload progress and error messages.
 * - Implements ControlValueAccessor for form integration.
 *
 * Inputs:
 * - accept: A string that specifies the accepted file types (e.g., 'image/*', '.pdf').
 * - promptMessage: A string that provides instructions to the user (default: 'Drag & drop here or press the button.').
 * - progress: A number representing the upload progress percentage (0-100).
 * - uploadError: A string that displays an error message related to file upload.
 *
 * Outputs:
 * - fileSelected: An event emitter that emits the selected file when a file is chosen.
 * 
 * <!-- Usage Example -->
 * <app-file-upload-container
 *   [accept]="'image/*'"
 *   [promptMessage]="'Drag & drop an image here or click to select.'"
 *   [progress]="uploadProgress"
 *   [uploadError]="uploadErrorMessage"
 *   (fileSelected)="onFileSelected($event)">
 * </app-file-upload-container>
 */
@Component({
  selector: 'app-file-upload-container',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './file-upload-container.html',
  styleUrl: './file-upload-container.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadContainer),
      multi: true
    }
  ]
})
export class FileUploadContainer implements ControlValueAccessor {
  // Referencja do elementu input
  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // Inputy jako Signal Inputs
  accept = input<string>('*/*');
  promptMessage = input<string>('Drag & drop here or press the button.');
  progress = input<number>(0);
  uploadErrorInput = input<string | null>(null, { alias: 'uploadError' });
  readonly fileSelected = output<File | null>();

  // Stan wewnętrzny
  selectedFile = signal<File | undefined>(undefined);
  isDisabled = signal<boolean>(false);
  isDragOver = signal<boolean>(false);
  localUploadError = signal<string | null>(null);

  // Wartości wyliczane
  effectiveUploadError = computed(() => this.localUploadError() ?? this.uploadErrorInput());

  formattedFileSize = computed(() => {
    const file = this.selectedFile();
    if (!file) {
      return '0 B';
    } else if (file.size < 1024) {
      return `${file.size} B`;
    } else if (file.size < 1024 * 1024) {
      return `${(file.size / 1024).toFixed(1)} KB`;
    } else if (file.size < 1024 * 1024 * 1024) {
      return `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(file.size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  });

  // Metody ControlValueAccessor
  onChange: (file: File | null) => void = () => { };
  onTouched: () => void = () => { };

  writeValue(value: File | null): void {
    if (!value) {
      this.resetState();
    } else {
      this.selectedFile.set(value);
      this.localUploadError.set(null);
    }
  }

  registerOnChange(fn: (file: File | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (this.isDisabled()) {
      return;
    }

    const file = event.dataTransfer?.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isDisabled()) {
      this.isDragOver.set(true);
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  clickFileInput() {
    if (!this.isDisabled()) {
      this.fileInput()?.nativeElement.click();
    }
  }

  private handleFile(file: File) {
    if (this.isFileTypeAccepted(file)) {
      this.selectedFile.set(file);
      this.onChange(file);
      this.fileSelected.emit(file);
      const inputEl = this.fileInput()?.nativeElement;
      if (inputEl) {
        inputEl.value = '';
      }
      this.localUploadError.set(null);
    } else {
      this.selectedFile.set(undefined);
      this.onChange(null);
      this.fileSelected.emit(null);
      this.localUploadError.set(`File type not accepted. Accepted types: ${this.accept()}`);
    }
    this.onTouched();
  }

  private resetState() {
    this.selectedFile.set(undefined);
    this.localUploadError.set(null);
    const inputEl = this.fileInput()?.nativeElement;
    if (inputEl) {
      inputEl.value = '';
    }
  }

  private isFileTypeAccepted(file: File): boolean {
    const acceptType = this.accept();
    if (!acceptType || acceptType === '*/*') {
      return true;
    }

    const acceptedTypes = acceptType.split(',').map(type => type.trim().toLowerCase());
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    return acceptedTypes.some(type => {
      // Sprawdzenie po rozszerzeniu (np. .png, .pdf)
      if (type.startsWith('.')) {
        return fileName.endsWith(type);
      }
      // Sprawdzenie po typie wildcard (np. image/*)
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return fileType.startsWith(`${baseType}/`);
      }
      // Sprawdzenie po dokładnym typie MIME (np. application/pdf)
      return fileType === type;
    });
  }
}
