import { ResolveFn, Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { MainLayout } from './core/main-layout/main-layout';


const crudTitle: ResolveFn<string> = route => {
    const name = route.paramMap.get('crudName') ?? 'Items';
    const label = name
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());

    const recordId = route.paramMap.get('recordId');

    if (!recordId) return label;
    return recordId === '__NEW__' ? `New ${label}` : `Edit ${label}`;
};

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
        path: 'users', title: "Users", canActivate: [authGuard], data: { roles: ['admin'] },
        loadComponent: () => import('./core/users/user-table/user-table').then(m => m.UserTable)
    },
    {
        path: 'users/:username', title: "Edit user", canActivate: [authGuard], data: { roles: ['admin'] },
        loadComponent: () => import('./core/users/user-edit/user-edit').then(m => m.UserEdit)
    },
    {
        path: 'users/:username/change-password', title: "Change password", canActivate: [authGuard], data: { roles: ['admin'] },
        loadComponent: () => import('./core/auth/change-password-form/change-password-form.component').then(m => m.ChangePasswordFormComponent)
    },
    {
        path: 'home', title: "AMPF Scaffold", canActivate: [authGuard],
        loadComponent: () => import('./core/home/home').then(m => m.Home)
    },
    {
        path: 'items', title: "Items", canActivate: [authGuard], data: { roles: ['user'] },
        loadComponent: () => import('./features/items/item-table/item-table').then(m => m.ItemTable)
    },
    {
        path: 'items/:itemId', title: "Edit item", canActivate: [authGuard], data: { roles: ['user'] },
        loadComponent: () => import('./features/items/item-edit/item-edit').then(m => m.ItemEdit)
    },
    {
        path: ':crudName', component: MainLayout, children: [
            { path: '', title: crudTitle, loadComponent: () => import('./shared/dynamic-table-client-side/dynamic-table-client-side').then(m => m.DynamicTableClientSide) }
        ]
    },

];
