import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Cabecera } from "./pages/cabecera/cabecera";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSlideToggleModule, Cabecera],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  mostrarCabeceraEnComponente:boolean = true;
  protected readonly title = signal('declaracion-impuestos');
  
}
