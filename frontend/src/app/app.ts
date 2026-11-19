import { Component, computed, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { Footer } from './layout/footer/footer';
import { AuthService } from './core/service/auth.service';
import { apiError } from './core/service/api-error';
import { Cargando } from './features/cargando/cargando';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Cargando],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {

  cargando = signal(true);
  extendiendoSesion = signal(false);
  errorSesion = signal<string|null>(null);

  tiempoRestante = computed(() => {
    const segundos = this.authService.segundosRestantes();
    const minutos = Math.floor(segundos / 60);
    const restantes = segundos % 60;

    return `${minutos}:${restantes.toString().padStart(2, '0')}`;
  });

  constructor(
    private router: Router,
    public authService: AuthService
  ) {}

  @ViewChild('modalSesion')
  set modalSesion(elemento: ElementRef<HTMLDialogElement> | undefined) {
    if (!elemento) return;

    this.errorSesion.set(null);
    elemento.nativeElement.showModal();
  }

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

  extenderSesion() {
    if (this.extendiendoSesion()) return;

    this.extendiendoSesion.set(true);
    this.errorSesion.set(null);

    this.authService.refrescarSesion().subscribe({
      next: () => {
        this.extendiendoSesion.set(false);
      },
      error: (error) => {
        this.extendiendoSesion.set(false);

        if (error.status === 401) {
          this.authService.finalizarSesion();
          return;
        }

        this.errorSesion.set(apiError(error));
      }
    });
  }

  cerrarAvisoSesion() {
    if (this.extendiendoSesion()) return;

    this.errorSesion.set(null);
    this.authService.cerrarAvisoSesion();
  }
}