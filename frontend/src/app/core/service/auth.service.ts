import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.interface';

interface Sesion {
    access_token: string;
}

export interface RegistroUsuario {
    nombre: string;
    apellido: string;
    correo: string;
    nombreDeUsuario: string;
    password: string;
    fechaDeNacimiento: string;
    descripcionBreve: string;
    fotoPerfil: File | null;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private http = inject(HttpClient);
    private url = environment.apiUrl + '/auth';
    private key = 'kwaksocial-token';

    currentUser = signal<Usuario | null>(null);
    currentUserData = signal<Usuario | null>(null);

    accesToken() {
        return localStorage.getItem(this.key);
    }

    signIn(identificador: string, password: string) {
        return this.http.post<Sesion>(this.url + '/login', {
            identificador,
            password
        });
    }

    signUp(datos: RegistroUsuario) {
        const formData = new FormData();

        formData.append('correo', datos.correo);
        formData.append('password', datos.password);
        formData.append('nombre', datos.nombre);
        formData.append('apellido', datos.apellido);
        formData.append('nombreDeUsuario', datos.nombreDeUsuario);
        formData.append('fechaDeNacimiento', datos.fechaDeNacimiento);
        formData.append('descripcionBreve', datos.descripcionBreve);

        if (datos.fotoPerfil) {
            formData.append('fotoPerfil', datos.fotoPerfil);
        }

        return this.http.post<Sesion>(
            this.url + '/register',
            formData
        );
    }

    iniciarSesion(token: string) {
        localStorage.setItem(this.key, token);
        return this.cargarPerfil();
    }

    private cargarPerfil() {
        return this.http.get<Usuario>(this.url + '/me').pipe(
            tap((perfil) => {
                this.currentUser.set(perfil);
                this.currentUserData.set(perfil);
            })
        );
    }

    restaurarSesion() {
        if (!this.accesToken()) return of(null);

        return this.cargarPerfil().pipe(
            catchError(() => {
                this.signOut();
                return of(null);
            })
        );
    }

    signOut() {
        localStorage.removeItem(this.key);
        this.currentUser.set(null);
        this.currentUserData.set(null);
    }
}