import { Component, input } from '@angular/core';
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { RouterModule } from '@angular/router';

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
    showHome = input(true);
}
