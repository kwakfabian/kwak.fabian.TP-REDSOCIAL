import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.interface';

export interface UsuarioAdministracion extends Usuario {
    activo: boolean;
}

export interface CrearUsuario {
    nombre: string;
    apellido: string;
    email: string;
    nombreUsuario: string;
    password: string;
    repetirPassword: string;
    fechaNacimiento: string;
    descripcionBreve: string;
    perfil: 'usuario' | 'administrador';
}

interface RespuestaEstadoUsuario {
    mensaje: string;
    id: string;
    activo: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UsuariosService {

    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/usuarios`;

    listar() {
        return this.http.get<UsuarioAdministracion[]>(this.apiUrl);
    }

    crear(datos: CrearUsuario, imagen?: File) {
        const formData = new FormData();

        formData.append('nombre', datos.nombre);
        formData.append('apellido', datos.apellido);
        formData.append('email', datos.email);
        formData.append('nombreUsuario', datos.nombreUsuario);
        formData.append('password', datos.password);
        formData.append('repetirPassword', datos.repetirPassword);
        formData.append('fechaNacimiento', datos.fechaNacimiento);
        formData.append('descripcionBreve', datos.descripcionBreve);
        formData.append('perfil', datos.perfil);

        if (imagen) {
            formData.append('imagenPerfil', imagen);
        }

        return this.http.post<UsuarioAdministracion>(this.apiUrl, formData);
    }

    deshabilitar(id: string) {
        return this.http.delete<RespuestaEstadoUsuario>(`${this.apiUrl}/${id}`);
    }

    habilitar(id: string) {
        return this.http.post<RespuestaEstadoUsuario>(
            `${this.apiUrl}/${id}/habilitar`,
            {}
        );
    }
}