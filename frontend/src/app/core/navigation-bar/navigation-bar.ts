import { Component, inject, input } from '@angular/core';
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { RouterModule } from '@angular/router';
import { MatMenuModule } from "@angular/material/menu";
import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-navigation-bar',
    imports: [
        MatToolbarModule,
        MatListModule,
        MatIconModule,
        RouterModule,
        MatMenuModule,
    ],
    templateUrl: './navigation-bar.html',
    styleUrl: './navigation-bar.scss',
})
export class NavigationBar {
    showHome = input(true);

    private authService = inject(AuthService);

    logout() {
        this.authService.logout().subscribe()
    }
}
