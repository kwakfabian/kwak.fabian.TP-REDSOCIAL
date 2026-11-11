import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";

export interface Publicacion {
    _id: string;
    usuarioId: string;
    titulo: string;
    descripcion: string;
    imagenUrl: string;
    likes: string[];
    cantidadLikes: number;
    activa: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface RespuestaPublicaciones {
    publicaciones: Publicacion[];
    total: number;
    offset: number;
    limit: number
}

@Injectable({
    providedIn: 'root'
})

export class PublicacionesService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/publicaciones`;

    listar(
        orden: 'fecha' | 'likes' = 'fecha',
        offset: number = 0,
        limit: number = 10,
        usuarioId?: string
    ): Observable<RespuestaPublicaciones> {
        
        let params = new HttpParams()
            .set('orden', orden)
            .set('offset', offset.toString())
            .set('limit', limit.toString());

        if (usuarioId) {
            params = params.set('usuarioId', usuarioId);
        };

        return this.http.get<RespuestaPublicaciones>(
            this.apiUrl, 
            { params }
        );
    }

    crear(titulo: string, descripcion: string, imagen?: File): Observable<Publicacion> {

        const formData = new FormData();

        formData.append('titulo', titulo);
        formData.append('descripcion', descripcion);

        if(imagen) {
            formData.append('imagen', imagen);
        }

        return this.http.post<Publicacion>(
            this.apiUrl,
            formData,
            { headers: this.obtenerHeader() }
        );
    }

    eliminar(id: string): Observable<{ mensaje: string }> {
        return this.http.delete<{ mensaje: string }> (
            `${this.apiUrl}/${id}`,
            { headers: this.obtenerHeader() }
        );
    }

    darLike(id: string): Observable<{ mensaje: string, cantidadLikes: number }> {
        return this.http.post<{mensaje:string, cantidadLikes: number}> (
            `${this.apiUrl}/${id}/like`,
            {},
            { headers: this.obtenerHeader() }
        );
    }

    quitarLike(id: string): Observable<{ mensaje: string, cantidadLikes: number }> {
        return this.http.delete<{mensaje:string, cantidadLikes: number}> (
            `${this.apiUrl}/${id}/like`,
            { headers: this.obtenerHeader() }
        );
    }

    private obtenerHeader() {
        const token = localStorage.getItem('kwaksocial-token');

        return {
            Authorization: `Bearer ${token ?? ''}`
        };
    }
}