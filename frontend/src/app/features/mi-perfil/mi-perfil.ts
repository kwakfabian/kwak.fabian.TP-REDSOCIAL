import { Component, inject, signal, effect, untracked, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/service/auth.service';
import { Publicacion, PublicacionesService } from '../../core/service/publicaciones.service';
import { Comentario, ComentariosService } from '../../core/service/comentarios.service';
import { apiError } from '../../core/service/api-error';
import { environment } from '../../../environments/environment';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

interface EstadoComentarios {
  comentarios: Comentario[];
  total: number;
  offset: number;
  cargando: boolean;
  error: string;
}

@Component({
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil {

  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private publicacionesService = inject(PublicacionesService);
  private comentariosService = inject(ComentariosService);
  private destroyRef = inject(DestroyRef);
  private usuarioCargado = '';

  publicaciones = signal<Publicacion[]>([]);
  cargandoPublicaciones = signal(false);
  errorPublicaciones = signal('');
  comentariosPorPublicacion = signal<Record<string, EstadoComentarios>>({});

  fotoPerfil = signal<File | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string|null>(null);
  successMessage = signal<string|null>(null);
  errorImagen = signal<string|null>(null);

  perfilForm = this.fb.group({
    nombre: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
      Validators.pattern(/\S/)
    ]],
    apellido: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
      Validators.pattern(/\S/)
    ]],
    email: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(254)
    ]],
    nombreUsuario: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(20),
      Validators.pattern(/\S/)
    ]],
    fechaNacimiento: ['', [
      Validators.required
    ]],
    descripcionBreve: ['', [
      Validators.required,
      Validators.maxLength(200),
      Validators.pattern(/\S/)
    ]]
  });

  constructor() {
    effect(() => {
      const usuario = this.authService.currentUserData();

      if (usuario && usuario.id !== this.usuarioCargado) {
        this.usuarioCargado = usuario.id;
        untracked(() => this.cargarPublicaciones(usuario.id));
      }
    });
  }

  obtenerUrlImagen(ruta: string): string {
    if (!ruta) return '';
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;

    return `${environment.apiUrl}/${ruta.replace(/^\/+/, '')}`;
  }

  abrirEditar(modal: HTMLDialogElement, input: HTMLInputElement) {
    const usuario = this.authService.currentUserData();
    if (!usuario) return;

    this.perfilForm.reset({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      nombreUsuario: usuario.nombreUsuario,
      fechaNacimiento: usuario.fechaNacimiento.slice(0, 10),
      descripcionBreve: usuario.descripcionBreve
    });

    this.fotoPerfil.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.errorImagen.set(null);
    input.value = '';

    modal.showModal();
  }

  cerrarEditar(modal: HTMLDialogElement) {
    if (this.isLoading()) return;

    modal.close();
  }

  seleccionarFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const imagen = input.files?.[0] ?? null;

    this.fotoPerfil.set(null);
    this.errorImagen.set(null);

    if (!imagen) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imagen.type) || imagen.size > 5 * 1024 * 1024) {
      this.errorImagen.set('Seleccioná una imagen JPG, PNG o WebP de hasta 5 MB.');
      input.value = '';
      return;
    }

    this.fotoPerfil.set(imagen);
  }

  onSubmit(modal: HTMLDialogElement) {
    if (this.isLoading()) return;

    const valores = this.perfilForm.getRawValue();

    this.perfilForm.patchValue({
      nombre: valores.nombre?.trim() ?? '',
      apellido: valores.apellido?.trim() ?? '',
      email: valores.email?.trim() ?? '',
      nombreUsuario: valores.nombreUsuario?.trim() ?? '',
      descripcionBreve: valores.descripcionBreve?.trim() ?? ''
    });

    this.perfilForm.markAllAsTouched();
    if (this.perfilForm.invalid || this.errorImagen()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { nombre, apellido, email, nombreUsuario, fechaNacimiento, descripcionBreve } = this.perfilForm.value;

    this.authService.actualizarPerfil({
      nombre: nombre!,
      apellido: apellido!,
      email: email!,
      nombreUsuario: nombreUsuario!,
      fechaNacimiento: fechaNacimiento!,
      descripcionBreve: descripcionBreve!
    }, this.fotoPerfil() ?? undefined).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.cerrarEditar(modal);
        this.successMessage.set('Tu perfil se actualizó correctamente.');
      },
      error: (error) => {
        this.errorMessage.set(apiError(error));
        this.isLoading.set(false);
      }
    });
  }

  cargarPublicaciones(usuarioId: string) {
    this.cargandoPublicaciones.set(true);
    this.errorPublicaciones.set('');
    this.comentariosPorPublicacion.set({});

    this.publicacionesService.listar('fecha', 0, 3, usuarioId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (respuesta) => {
        this.publicaciones.set(respuesta.publicaciones);
        this.cargandoPublicaciones.set(false);

        respuesta.publicaciones.forEach(publicacion => this.cargarComentarios(publicacion._id));
      },
      error: (error) => {
        this.errorPublicaciones.set(apiError(error));
        this.cargandoPublicaciones.set(false);
      }
    });
  }

  cargarComentarios(publicacionId: string) {
    const estado = this.comentariosPorPublicacion()[publicacionId] ?? {
      comentarios: [],
      total: 0,
      offset: 0,
      cargando: false,
      error: ''
    };

    if (estado.cargando) return;

    this.comentariosPorPublicacion.update(actuales => ({
      ...actuales,
      [publicacionId]: { ...estado, cargando: true, error: '' }
    }));

    this.comentariosService.listar(publicacionId, estado.offset, 5).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (respuesta) => {
        const nuevos = respuesta.comentarios.filter(comentario =>
          !estado.comentarios.some(actual => actual._id === comentario._id)
        );

        this.comentariosPorPublicacion.update(actuales => ({
          ...actuales,
          [publicacionId]: {
            comentarios: [...estado.comentarios, ...nuevos],
            total: respuesta.total,
            offset: estado.offset + respuesta.comentarios.length,
            cargando: false,
            error: ''
          }
        }));
      },
      error: (error) => {
        this.comentariosPorPublicacion.update(actuales => ({
          ...actuales,
          [publicacionId]: { ...estado, cargando: false, error: apiError(error) }
        }));
      }
    });
  }
}