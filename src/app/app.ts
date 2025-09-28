import { AuthService } from './shared/services/auth-service';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Cabecera } from './pages/cabecera/cabecera';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSlideToggleModule, Cabecera],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private AuthService = inject(AuthService);
  mostrarCabeceraEnComponente:boolean = false;
  protected readonly title = signal('declaracion-impuestos');
  ngOnInit(): void {
    if (this.AuthService.getUserRole()){
      this.mostrarCabeceraEnComponente = true;
    }

  }
}
