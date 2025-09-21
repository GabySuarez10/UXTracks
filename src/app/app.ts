import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Prueba } from './prueba/prueba';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Prueba, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('uxtracks');
}
