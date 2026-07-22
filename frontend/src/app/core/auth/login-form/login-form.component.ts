import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { FullscreenLoaderService } from '../../../shared/fullscreen-loader.service';
import { AuthService } from '../auth.service';
import { ConfigService } from '../../config.service';

@Component({
    selector: 'app-login-form',
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatInputModule,
        MatButton,
        MatFormFieldModule,
        MatCheckboxModule,
        RouterModule,
    ],
    templateUrl: './login-form.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './login-form.component.scss'
})
export class LoginFormComponent implements OnInit, OnDestroy {
    credentials = { username: '', password: '' };
    store_token = false;

    private authService = inject(AuthService);
    private router = inject(Router);
    private snackBar = inject(MatSnackBar);
    private loader = inject(FullscreenLoaderService);
    public configService = inject(ConfigService);

    ngOnInit() {
        if (this.authService.isAuthenticated())
            this.router.navigate(['/']);
    }

    ngOnDestroy(): void {
        if (this.loader.isVisible())
            this.loader.hide();
    }

    onSubmit() {
        this.loader.show({ message: 'Signing in ...' });
        this.authService.login(this.credentials, this.store_token).subscribe({
            error: (err) => {
                this.loader.hide();
                if (err.status === 401)
                    this.snackBar.open(`Wrong username or password`, `Close`, { duration: 1500 });
                else {
                    console.warn(err.message);
                    this.snackBar.open(err.message, `Close`);
                }
            }
        });
    }
}
