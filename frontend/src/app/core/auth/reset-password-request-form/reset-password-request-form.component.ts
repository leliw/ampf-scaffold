import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-reset-password-request-form',
    imports: [
        RouterModule,
        ReactiveFormsModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatFormFieldModule,
    ],
    templateUrl: './reset-password-request-form.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './reset-password-request-form.component.scss'
})
export class ResetPasswordRequestFormComponent {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private snackbar = inject(MatSnackBar);
    private authService = inject(AuthService);

    form = this.fb.group({
        email: ['', [Validators.email, Validators.required]],
    });

    onSubmit() {
        const email = this.form.value.email;
        if (email)
            this.authService.resetPasswordRequest(email).subscribe({
                complete: () => this.snackbar.open(`The code was sent to your email: ${email}`, `Reset password`)
                    .afterDismissed().subscribe(() =>
                        this.router.navigateByUrl("/reset-password")),
                error: (err) => this.snackbar.open(err.error?.detail ?? err.message, `Close`),
            })
    }
}
