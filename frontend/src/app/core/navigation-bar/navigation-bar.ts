import { Component, inject, input } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterModule } from '@angular/router';
import { AuthStateService } from '../auth/auth-state.service';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '../config.service';

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
    public configService = inject(ConfigService);
    showHome = input(true);

    private authService = inject(AuthService);
    public authStateService = inject(AuthStateService);

    logout() {
        this.authService.logout().subscribe()
    }
}
