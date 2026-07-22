import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', title: "AMPF Scaffold", loadComponent: () => import('./core/home/home').then(m => m.Home) },
];
