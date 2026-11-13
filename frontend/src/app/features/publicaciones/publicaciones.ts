import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicacionesService, Publicacion } from '../../core/service/publicaciones.service';
import { PublicacionesCard } from '../../shared/components/publicaciones-card/publicaciones-card';
import { apiError } from '../../core/service/api-error';

@Component({
  imports: [PublicacionesCard, ReactiveFormsModule],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones implements OnInit{

  private fb = inject(FormBuilder);
  private publicacionesService = inject(PublicacionesService);

  publicaciones = signal<Publicacion[]>([]);
  cargando = signal(true);
  mensajeError = signal('');

  ordenSeleccionado = signal<'fecha' | 'likes'>('fecha');

  paginaActual = signal(1);
  limite = 5;
  totalPublicaciones = signal(0);

  imagenPublicacion = signal<File | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string|null>(null);
  successMessage = signal<string|null>(null);

  publicacionForm = this.fb.group({
    titulo: ['', [
      Validators.required,
      Validators.pattern(/\S/)
    ]],
    descripcion: ['', [
      Validators.required,
      Validators.pattern(/\S/)
    ]]
  });

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
        this.totalPublicaciones.set(respuesta.total);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar las publicaciones:', error);
        this.mensajeError.set('No se pudieron cargar las publicaciones');
        this.cargando.set(false);
      }
    });
  }

  abrirModal(modal: HTMLDialogElement, input: HTMLInputElement) {
    this.publicacionForm.reset();
    this.imagenPublicacion.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    input.value = '';

    modal.showModal();
  }

  cerrarModal(modal: HTMLDialogElement) {
    if (this.isLoading()) return;

    modal.close();
  }

  seleccionarImagen(event: Event) {
    const input = event.target as HTMLInputElement;
    const imagen = input.files?.[0] ?? null;

    this.errorMessage.set(null);
    this.imagenPublicacion.set(null);

    if (!imagen) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imagen.type)) {
      this.errorMessage.set('La imagen debe ser JPG, PNG o WebP.');
      input.value = '';
      return;
    }

    this.imagenPublicacion.set(imagen);
  }

  quitarImagen(input: HTMLInputElement) {
    this.imagenPublicacion.set(null);
    input.value = '';
  }

  onSubmit(modal: HTMLDialogElement) {
    if (this.isLoading()) return;

    this.publicacionForm.markAllAsTouched();
    if (this.publicacionForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { titulo, descripcion } = this.publicacionForm.value;

    this.publicacionesService.crear(
      titulo!.trim(),
      descripcion!.trim(),
      this.imagenPublicacion() ?? undefined
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.cerrarModal(modal);
        this.successMessage.set('Publicación creada correctamente.');
        this.ordenSeleccionado.set('fecha');
        this.paginaActual.set(1);
        this.cargarPublicaciones();
      },
      error: (error) => {
        this.errorMessage.set(apiError(error));
        this.isLoading.set(false);
      }
    });
  }

  cambiarOrden(orden: 'fecha' | 'likes') {
    if (this.ordenSeleccionado() === orden) return;

    this.ordenSeleccionado.set(orden);
    this.paginaActual.set(1);
    this.cargarPublicaciones();
  }

  paginaAnterior() {
    if(this.paginaActual() <= 1) return;

    this.paginaActual.update(pagina => pagina - 1);
    this.cargarPublicaciones();
  }

  paginaSiguiente() {
    if(this.paginaActual() >= this.totalPaginas()) return;

    this.paginaActual.update(pagina => pagina + 1);
    this.cargarPublicaciones();
  }

  publicacionEliminada() {
    if(this.publicaciones().length === 1 && this.paginaActual() > 1) {
      this.paginaActual.update(pagina => pagina - 1);
    }

    this.cargarPublicaciones();
  }
}