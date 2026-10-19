import { Component } from '@angular/core';
import { NavigationBar } from '../navigation-bar/navigation-bar';

@Component({
    selector: 'app-home',
    imports: [
        NavigationBar
    ],
    templateUrl: './home.html',
    styleUrl: './home.scss',
})
export class Home { }
