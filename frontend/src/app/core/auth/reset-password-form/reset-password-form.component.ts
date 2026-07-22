import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from "@angular/material/input";
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { newPasswordEqualsValidator, passwordStrengthValidator } from '../../validators';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-reset-password-form',
    imports: [
        RouterModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
    ],
    templateUrl: './reset-password-form.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './reset-password-form.component.scss'
})
export class ResetPasswordFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private snackbar = inject(MatSnackBar);
    private authService = inject(AuthService);

    form = this.fb.group({
        email: ['', [Validators.email, Validators.required]],
        reset_code: ['', Validators.required],
        new_password: ['', [Validators.required, passwordStrengthValidator(8)]],
        new_password2: ['', [Validators.required, newPasswordEqualsValidator()]],
    })

    ngOnInit(): void {
        this.form.controls.new_password.valueChanges.subscribe(() => {
            this.form.controls.new_password2.updateValueAndValidity();
        });
    }

    onSubmit() {
        const formData = this.form.value;
        if (formData.email && formData.reset_code && formData.new_password)
            this.authService.resetPassword(formData.email, formData.reset_code, formData.new_password).subscribe({
                complete: () => this.snackbar.open(`Password changed successfully`, `Login`, { duration: 1500 })
                    .afterDismissed().subscribe(() => this.router.navigateByUrl("/login")),
                error: (err) => this.snackbar.open(err.error?.detail ?? err.message, `Close`)
            })
    }
}
