import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PublicacionesService, Publicacion } from '../../core/service/publicaciones.service';
import { PublicacionesCard } from '../../shared/components/publicaciones-card/publicaciones-card';

@Component({
  imports: [PublicacionesCard],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones implements OnInit{

  private publicacionesService = inject(PublicacionesService)

  publicaciones = signal<Publicacion[]>([]);
  cargando = signal(true);
  mensajeError = signal('');

  ordenSeleccionado = signal<'fecha' | 'likes'>('fecha');

  paginaActual = signal(1);
  limite = 5;
  totalPublicaciones = signal(0);

  totalPaginas = computed(() => {
    return Math.ceil(this.totalPublicaciones() / this.limite);
  });

  ngOnInit() {
    this.cargarPublicaciones();
  }

  cargarPublicaciones() {
    this.cargando.set(true);
    this.mensajeError.set('');
    
    const offset = (this.paginaActual() - 1) * this.limite;

    this.publicacionesService.listar(this.ordenSeleccionado(), offset, this.limite).subscribe({
      next: (respuesta) => {
        this.publicaciones.set(respuesta.publicaciones);
        this.totalPublicaciones.set(respuesta.total)
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar las publicaciones:', error);
        this.mensajeError.set('No se pudieron cargar las publicaciones');
        this.cargando.set(false);
      }
    });
  }

  cambiarOrden( orden: 'fecha' | 'likes' ) {
    if (this.ordenSeleccionado() === orden) return;

    this.ordenSeleccionado.set(orden);
    this.paginaActual.set(1);
    this.cargarPublicaciones()
  }

  paginaAnterior() {
    if(this.paginaActual() <= 1) return;

    this.paginaActual.update(pagina => pagina - 1 );
    this.cargarPublicaciones();
  }

  paginaSiguiente() {
    if(this.paginaActual() >= this.totalPaginas()) return;
    this.paginaActual.update(pagina => pagina + 1);
    this.cargarPublicaciones();
  }

  publicacionEliminada() {
    if(this.publicaciones().length === 1 && this.paginaActual() > 1) {
      this.paginaActual.update(pagina => pagina -1);
    }

    this.cargarPublicaciones();
  }
}
