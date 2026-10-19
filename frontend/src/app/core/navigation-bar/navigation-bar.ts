import { Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ConfigService } from '../config.service';

@Component({
    selector: 'app-navigation-bar',
    imports: [
        MatToolbarModule,
        MatListModule,
        MatIconModule,
        RouterModule,
    ],
    templateUrl: './navigation-bar.html',
    styleUrl: './navigation-bar.scss',
})
export class NavigationBar {
    public configService = inject(ConfigService);
    showHome = input(true);
}
