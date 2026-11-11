import { Component, inject, signal, effect } from '@angular/core';
import { AuthService } from '../../core/service/auth.service';
import { Publicacion, PublicacionesService } from '../../core/service/publicaciones.service';

@Component({
  imports: [],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil {

  public authService = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);

  publicaciones = signal<Publicacion[]>([]);
  cargandoPublicaciones = signal(false);
  errorPublicaciones = signal('');

  constructor() {
    effect(() => {
      const usuario = this.authService.currentUserData();

      if (usuario) {
        this.cargarPublicaciones(usuario.id);
      }
    });
  }

  cargarPublicaciones(usuarioId: string) {
    this.cargandoPublicaciones.set(true);
    this.errorPublicaciones.set('');

    this.publicacionesService.listar('fecha', 0, 3, usuarioId).subscribe({
      next: (respuesta) => {
        this.publicaciones.set(respuesta.publicaciones);
        this.cargandoPublicaciones.set(false);
      },

      error: (error) => {
        console.error('Error al cargar publicaciones:', error);
        this.errorPublicaciones.set('No se pudieron cargar las publicaciones');
        this.cargandoPublicaciones.set(false);
      }
    });
  }
}