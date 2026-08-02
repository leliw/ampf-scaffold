import { CommonModule, Location } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { email, form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs/operators';
import { RoleService } from '../../auth/role.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-edit',
  imports: [
    CommonModule,
    FormField,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,

  ],
  templateUrl: './user-edit.html',
  styleUrl: './user-edit.scss',
})
export class UserEdit {
  username = input.required<string>();

  private userService = inject(UserService);
  private roleService = inject(RoleService);

  resource = rxResource({
    params: () => {
      const username = this.username();
      return username != "__NEW__" ? ({ username }) : undefined;
    },
    stream: ({ params }) => this.userService.get(params.username)
  });
  originalModel = linkedSignal(() => {
    const user = this.resource.value() ?? this.userService.new();
    return { ...user, password: user.password ?? '' };
  });
  model = linkedSignal(() => structuredClone(this.originalModel()));
  form = form(this.model, (s) => {
    required(s.username, { message: 'Username is required' });
    required(s.email, { message: 'Email is required' })
    email(s.email);
    required(s.name, { message: 'Name is required' });
  });

  location = inject(Location);
  snackBar = inject(MatSnackBar);

  isCreateMode = computed(() => this.username() === '__NEW__');
  isLoading = linkedSignal(() => this.resource.isLoading());
  isSaving = signal(false);
  isBusy = computed(() => this.isLoading() || this.isSaving());
  canSubmit = computed(() =>
    !this.isLoading() &&
    !this.isSaving() &&
    this.form().dirty() &&
    !this.form().invalid()
  );

  roles = rxResource({
    stream: () => this.roleService.getAll()
  });

  submit(event: Event) {
    event.preventDefault();
    this.isSaving.set(true);
    const request$ = this.isCreateMode()
      ? this.userService.create(this.model())
      : this.userService.update(this.username(), this.model());

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

  onUsernameBlur() {
    const usernameValue = this.model().username;
    if (usernameValue && usernameValue.includes('@')) {
      this.model.update(m => ({ ...m, email: usernameValue.toLowerCase() }));
    }
  }

  onClose(): void {
    this.location.back();
  }

}

