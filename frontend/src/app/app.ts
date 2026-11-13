import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { AuthService } from './core/service/auth.service';
import { Cargando } from './features/cargando/cargando';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Cargando],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {

  cargando = signal(true);

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.restaurarSesion().subscribe({
      next: (usuario) => {
        const ruta = usuario ? '/publicaciones' : '/login';

        this.router.navigateByUrl(ruta, { replaceUrl: true }).then(() => {
          this.cargando.set(false);
        }).catch(() => {
          this.cargando.set(false);
        });
      }
    });
  }
}