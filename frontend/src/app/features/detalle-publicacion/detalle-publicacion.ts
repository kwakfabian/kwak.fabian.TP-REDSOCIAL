import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Publicacion, PublicacionesService } from '../../core/service/publicaciones.service';
import { Comentario, ComentariosService } from '../../core/service/comentarios.service';
import { AuthService } from '../../core/service/auth.service';
import { apiError } from '../../core/service/api-error';
import { PublicacionesCard } from '../../shared/components/publicaciones-card/publicaciones-card';

@Component({
  imports: [DatePipe, ReactiveFormsModule, RouterLink, PublicacionesCard],
  selector: 'app-detalle-publicacion',
  styleUrl: './detalle-publicacion.css',
  templateUrl: './detalle-publicacion.html',
})
export class DetallePublicacion implements OnInit {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicacionesService = inject(PublicacionesService);
  private comentariosService = inject(ComentariosService);
  private authService = inject(AuthService);

  publicacion = signal<Publicacion | null>(null);
  comentarios = signal<Comentario[]>([]);

  cargando = signal(true);
  cargandoComentarios = signal(false);
  isLoading = signal(false);
  guardandoEdicion = signal(false);

  mensajeError = signal<string|null>(null);
  errorComentarios = signal<string|null>(null);
  errorMessage = signal<string|null>(null);
  errorEdicion = signal<string|null>(null);

  totalComentarios = signal(0);
  comentarioSeleccionado = signal<string|null>(null);

  publicacionId = '';
  offset = 0;
  limite = 5;

  comentarioForm = this.fb.group({
    mensaje: ['', [
      Validators.required,
      Validators.pattern(/\S/)
    ]]
  });

  editarForm = this.fb.group({
    mensaje: ['', [
      Validators.required,
      Validators.pattern(/\S/)
    ]]
  });

  ngOnInit() {
    this.publicacionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.cargarPublicacion();
  }

  cargarPublicacion() {
    this.cargando.set(true);
    this.mensajeError.set(null);

    this.publicacionesService.obtenerPorId(this.publicacionId).subscribe({
      next: (respuesta) => {
        this.publicacion.set(respuesta);
        this.cargando.set(false);
        this.cargarComentarios();
      },
      error: (error) => {
        this.mensajeError.set(apiError(error));
        this.cargando.set(false);
      }
    });
  }

  cargarComentarios() {
    if (this.cargandoComentarios()) return;

    this.cargandoComentarios.set(true);
    this.errorComentarios.set(null);

    this.comentariosService.listar(this.publicacionId, this.offset, this.limite).subscribe({
      next: (respuesta) => {
        this.comentarios.update(actuales => {
          const nuevos = respuesta.comentarios.filter(comentario =>
            !actuales.some(actual => actual._id === comentario._id)
          );

          return [...actuales, ...nuevos];
        });

        this.offset += respuesta.comentarios.length;
        this.totalComentarios.set(respuesta.total);
        this.cargandoComentarios.set(false);
      },
      error: (error) => {
        this.errorComentarios.set(apiError(error));
        this.cargandoComentarios.set(false);
      }
    });
  }

  onSubmit() {
    if (this.isLoading() || this.cargandoComentarios() || this.guardandoEdicion()) return;

    this.comentarioForm.markAllAsTouched();
    if (this.comentarioForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { mensaje } = this.comentarioForm.value;

    this.comentariosService.crear(this.publicacionId, mensaje!.trim()).subscribe({
      next: (comentario) => {
        this.comentarios.update(actuales => [comentario, ...actuales]);
        this.totalComentarios.update(total => total + 1);

        if (this.offset > 0) {
          this.offset += 1;
        }

        this.comentarioForm.reset();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(apiError(error));
        this.isLoading.set(false);
      }
    });
  }

  esPropietario(comentario: Comentario) {
    return comentario.usuarioId === this.authService.currentUserData()?.id;
  }

  abrirEditar(comentario: Comentario, modal: HTMLDialogElement) {
    if (!this.esPropietario(comentario)) return;

    this.comentarioSeleccionado.set(comentario._id);
    this.editarForm.reset({ mensaje: comentario.mensaje });
    this.errorEdicion.set(null);

    modal.showModal();
  }

  cerrarEditar(modal: HTMLDialogElement) {
    if (this.guardandoEdicion()) return;

    modal.close();
    this.comentarioSeleccionado.set(null);
  }

  guardarEdicion(modal: HTMLDialogElement) {
    if (this.guardandoEdicion()) return;

    this.editarForm.markAllAsTouched();
    if (this.editarForm.invalid) return;

    const id = this.comentarioSeleccionado();
    if (!id) return;

    const { mensaje } = this.editarForm.value;

    this.guardandoEdicion.set(true);
    this.errorEdicion.set(null);

    this.comentariosService.editar(id, mensaje!.trim()).subscribe({
      next: (respuesta) => {
        this.comentarios.update(actuales =>
          actuales.map(comentario => comentario._id === respuesta._id ? respuesta : comentario)
        );

        this.guardandoEdicion.set(false);
        this.cerrarEditar(modal);
      },
      error: (error) => {
        this.errorEdicion.set(apiError(error));
        this.guardandoEdicion.set(false);
      }
    });
  }

  publicacionEliminada() {
    this.router.navigate(['/publicaciones']);
  }
}