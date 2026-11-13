import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Comentario {
    _id: string;
    publicacionId: string;
    usuarioId: string;
    mensaje: string;
    modificado: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface RespuestaComentarios {
    comentarios: Comentario[];
    total: number;
    offset: number;
    limit: number;
}

@Injectable({
    providedIn: 'root'
})
export class ComentariosService {

    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = `${environment.apiUrl}/comentarios`;

    listar(
        publicacionId: string,
        offset: number = 0,
        limit: number = 5
    ): Observable<RespuestaComentarios> {

        const params = new HttpParams()
            .set('offset', offset.toString())
            .set('limit', limit.toString());

        return this.http.get<RespuestaComentarios>(
            `${this.apiUrl}/publicacion/${publicacionId}`,
            { params, headers: this.obtenerHeader() }
        );
    }

    crear(publicacionId: string, mensaje: string): Observable<Comentario> {
        return this.http.post<Comentario>(
            `${this.apiUrl}/publicacion/${publicacionId}`,
            { mensaje },
            { headers: this.obtenerHeader() }
        );
    }

    editar(id: string, mensaje: string): Observable<Comentario> {
        return this.http.put<Comentario>(
            `${this.apiUrl}/${id}`,
            { mensaje },
            { headers: this.obtenerHeader() }
        );
    }

    private obtenerHeader() {
        const token = this.authService.accesToken();

        return {
            Authorization: `Bearer ${token ?? ''}`
        };
    }
}