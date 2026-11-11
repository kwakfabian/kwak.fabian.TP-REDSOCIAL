import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Publicacion, PublicacionesService } from '../../../core/service/publicaciones.service';
import { AuthService } from '../../../core/service/auth.service';

@Component({
    selector: 'app-publicaciones-card',
    imports: [DatePipe],
    templateUrl: './publicaciones-card.html',
    styleUrl: './publicaciones-card.css'
})
export class PublicacionesCard {

    private publicacionesService = inject(PublicacionesService);
    private authService = inject(AuthService);

    publicacion = input.required<Publicacion>();
    publicacionEliminada = output<string>();

    procesandoLike = signal(false);
    eliminando = signal(false);
    mensajeError = signal('');

    cantidadLikes = signal<number | null>(null);
    likeLocal = signal<boolean | null>(null);

    usuarioId = computed(() => {
        return this.authService.currentUserData()?.id;
    });

    esPropietario = computed(() => {
        const id = this.usuarioId();

        if (!id) return false;

        return this.publicacion().usuarioId === id;
    });

    esAdministrador = computed(() => {
        return this.authService.currentUserData()?.perfil === 'administrador';
    });

    tieneLike = computed(() => {
        if (this.likeLocal() !== null) {
            return this.likeLocal()!;
        }

        const id = this.usuarioId();

        if (!id) return false;

        return this.publicacion().likes.includes(id);
    });

    totalLikes = computed(() => {
        return this.cantidadLikes() ?? this.publicacion().cantidadLikes;
    });

    obtenerUrlImagen(ruta: string): string {
        if (!ruta) return '';
        if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
        return `http://localhost:3100/${ruta.replace(/^\/+/, '')}`;
    }

    cambiarLike() {
        if (this.procesandoLike() || this.eliminando()) return;

        if (!this.usuarioId()) {
            this.mensajeError.set('Debes iniciar sesion para dar like');
            return;
        }

        this.procesandoLike.set(true);
        this.mensajeError.set('');

        const teniaLike = this.tieneLike();

        const peticion = teniaLike
            ? this.publicacionesService.quitarLike(this.publicacion()._id)
            : this.publicacionesService.darLike(this.publicacion()._id);

        peticion.subscribe({
            next: (respuesta) => {
                this.cantidadLikes.set(respuesta.cantidadLikes);
                this.likeLocal.set(!teniaLike);
                this.procesandoLike.set(false);
            },
            error: (error) => {
                console.error('Error al actualizar like: ', error);
                this.mensajeError.set('No se pudo actualizar el like');
                this.procesandoLike.set(false);
            }
        });
    }

    eliminarPublicacion() {
        if ((!this.esPropietario() && !this.esAdministrador()) || this.eliminando() || this.procesandoLike()) return;

        const confirmar = window.confirm('¿Estás seguro de que querés eliminar esta publicación?');

        if (!confirmar) return;

        this.eliminando.set(true);
        this.mensajeError.set('');

        this.publicacionesService.eliminar(this.publicacion()._id).subscribe({
            next: () => {
                this.eliminando.set(false);
                this.publicacionEliminada.emit(this.publicacion()._id);
            },
            error: (error) => {
                console.error('Error al eliminar la publicación:', error);
                this.mensajeError.set('No se pudo eliminar la publicación');
                this.eliminando.set(false);
            }
        });
    }
}