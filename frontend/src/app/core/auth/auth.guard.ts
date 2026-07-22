import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const snackBar = inject(MatSnackBar);
    const authService = inject(AuthService);
    const authStateService = inject(AuthStateService);
    const requiredRoles = route.data?.['roles'] as string[] | undefined;

    if (!authStateService.isAuthenticated()) {
        authService.redirectUrl = state.url;
        router.navigate(['/login']);
        return false;
    } else if (requiredRoles && !authStateService.hasAnyRole(requiredRoles)) {
        snackBar.open(`Permission denied`, `Close`, { duration: 3000 });
        router.navigate(['/']);
        return false;
    } else {
        return true;
    }
};
