import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfigService } from './core/config.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
  public configService = inject(ConfigService);
}
