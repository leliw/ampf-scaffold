import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'login', title: "AMPF Scaffold - Sign In", loadComponent: () => import('./core/auth/login-form/login-form.component').then(m => m.LoginFormComponent) },

    { path: 'home', title: "AMPF Scaffold", canActivate: [authGuard], loadComponent: () => import('./core/home/home').then(m => m.Home) },
];
