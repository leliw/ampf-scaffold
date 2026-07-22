import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    {
        path: 'login', title: "AMPF Scaffold - Sign In",
        loadComponent: () => import('./core/auth/login-form/login-form.component').then(m => m.LoginFormComponent)
    },
    {
        path: 'change-password', title: "Change password", canActivate: [authGuard],
        loadComponent: () => import('./core/auth/change-password-form/change-password-form.component').then(m => m.ChangePasswordFormComponent)
    },
    {
        path: 'reset-password-request', title: "Reset password request",
        loadComponent: () => import('./core/auth/reset-password-request-form/reset-password-request-form.component').then(mod => mod.ResetPasswordRequestFormComponent)
    },
    {
        path: 'reset-password', title: "Reset password",
        loadComponent: () => import('./core/auth/reset-password-form/reset-password-form.component').then(mod => mod.ResetPasswordFormComponent)
    },

    {
        path: 'home', title: "AMPF Scaffold", canActivate: [authGuard],
        loadComponent: () => import('./core/home/home').then(m => m.Home)
    },
];
