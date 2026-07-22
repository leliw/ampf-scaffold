import { Component, inject } from '@angular/core';
import { NavigationBar } from "../navigation-bar/navigation-bar";
import { ConfigService } from '../config.service';

@Component({
    selector: 'app-home',
    imports: [
        NavigationBar
    ],
    templateUrl: './home.html',
    styleUrl: './home.scss',
})
export class Home { 
      public configService = inject(ConfigService);
}
