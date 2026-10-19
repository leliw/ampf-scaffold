import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationBar } from '../navigation-bar/navigation-bar';

@Component({
  selector: 'app-main-layout',
  imports: [
    NavigationBar,
    RouterOutlet
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
}
