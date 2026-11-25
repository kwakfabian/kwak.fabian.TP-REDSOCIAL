import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface PublicacionesPorUsuario {
    usuarioId: string;
    nombreUsuario: string;
    cantidad: number;
}

export interface ComentariosPorDia {
    fecha: string;
    cantidad: number;
}

export interface ComentariosPorPublicacion {
    publicacionId: string;
    titulo: string;
    cantidad: number;
}

export interface RespuestaEstadisticas<T> {
    desde: string;
    hasta: string;
    total: number;
    datos: T[];
}

@Injectable({
    providedIn: 'root'
})
export class EstadisticasService {

    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/estadisticas`;

    publicacionesPorUsuario(desde: string, hasta: string) {
        const params = new HttpParams().set('desde', desde).set('hasta', hasta);

        return this.http.get<RespuestaEstadisticas<PublicacionesPorUsuario>>(
            `${this.apiUrl}/publicaciones-por-usuario`,
            { params }
        );
    }

    comentariosPorDia(desde: string, hasta: string) {
        const params = new HttpParams().set('desde', desde).set('hasta', hasta);

        return this.http.get<RespuestaEstadisticas<ComentariosPorDia>>(
            `${this.apiUrl}/comentarios-por-dia`,
            { params }
        );
    }

    comentariosPorPublicacion(desde: string, hasta: string) {
        const params = new HttpParams().set('desde', desde).set('hasta', hasta);

        return this.http.get<RespuestaEstadisticas<ComentariosPorPublicacion>>(
            `${this.apiUrl}/comentarios-por-publicacion`,
            { params }
        );
    }
}