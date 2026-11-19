import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
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
    repetirPassword: string;
    fechaDeNacimiento: string;
    descripcionBreve: string;
    fotoPerfil: File | null;
}

export interface EditarPerfil {
    nombre: string;
    apellido: string;
    email: string;
    nombreUsuario: string;
    fechaNacimiento: string;
    descripcionBreve: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private http = inject(HttpClient);
    private router = inject(Router);
    private url = environment.apiUrl + '/auth';
    private key = 'kwaksocial-token';

    private contador?: ReturnType<typeof setInterval>;
    private vencimiento = 0;
    private avisoMostrado = false;

    currentUser = signal<Usuario | null>(null);
    currentUserData = signal<Usuario | null>(null);

    mostrarAvisoSesion = signal(false);
    segundosRestantes = signal(0);

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
        formData.append('email', datos.correo);
        formData.append('password', datos.password);
        formData.append('repetirPassword', datos.repetirPassword);
        formData.append('nombre', datos.nombre);
        formData.append('apellido', datos.apellido);
        formData.append('nombreUsuario', datos.nombreDeUsuario);
        formData.append('fechaNacimiento', datos.fechaDeNacimiento);
        formData.append('descripcionBreve', datos.descripcionBreve);

        if (datos.fotoPerfil) {
            formData.append('imagenPerfil', datos.fotoPerfil);
        }

        return this.http.post<Sesion>(
            this.url + '/register',
            formData
        );
    }

    iniciarSesion(token: string) {
        this.detenerContador();
        localStorage.setItem(this.key, token);

        return this.cargarPerfil();
    }

    private cargarPerfil() {
        const token = this.accesToken();

        const headers = new HttpHeaders({
            Authorization: `Bearer ${token ?? ''}`
        });

        return this.http.post<Usuario>(this.url + '/autorizar', {}, { headers }).pipe(
            tap((perfil) => {
                this.currentUser.set(perfil);
                this.currentUserData.set(perfil);
                this.iniciarContador();
            })
        );
    }

    restaurarSesion() {
        if (!this.accesToken()) {
            this.signOut();
            return of(null);
        }

        return this.cargarPerfil().pipe(
            catchError(() => {
                this.signOut();
                return of(null);
            })
        );
    }

    refrescarSesion() {
        const token = this.accesToken();

        const headers = new HttpHeaders({
            Authorization: `Bearer ${token ?? ''}`
        });

        return this.http.post<Sesion>(this.url + '/refrescar', {}, { headers }).pipe(
            tap((sesion) => {
                if (this.accesToken() !== token) return;

                localStorage.setItem(this.key, sesion.access_token);
                this.iniciarContador();
            })
        );
    }

    private iniciarContador() {
        this.detenerContador();
        const token = this.accesToken();

        if (!token) {
            this.finalizarSesion();
            return;
        }

        try {
            const parte = token.split('.')[1];
            const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
            const contenido = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
            const payload = JSON.parse(atob(contenido));

            if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
                this.finalizarSesion();
                return;
            }

            this.vencimiento = payload.exp * 1000;
        } catch {
            this.finalizarSesion();
            return;
        }
        this.verificarTiempo();

        if (this.vencimiento > Date.now()) {
            this.contador = setInterval(() => {
                this.verificarTiempo();
            }, 1000);
        }
    }

    private verificarTiempo() {
        const segundos = Math.max(0, Math.ceil((this.vencimiento - Date.now()) / 1000));
        this.segundosRestantes.set(segundos);

        if (segundos === 0) {
            this.finalizarSesion();
            return;
        }

        if (segundos <= 60 && !this.avisoMostrado) {
            this.avisoMostrado = true;
            this.mostrarAvisoSesion.set(true);
        }
    }

    cerrarAvisoSesion() {
        this.mostrarAvisoSesion.set(false);
    }

    finalizarSesion() {
        this.signOut();
        this.router.navigate(['/login']);
    }

    private detenerContador() {
        if (this.contador !== undefined) {
            clearInterval(this.contador);
            this.contador = undefined;
        }

        this.vencimiento = 0;
        this.avisoMostrado = false;
        this.segundosRestantes.set(0);
        this.mostrarAvisoSesion.set(false);
    }

    actualizarPerfil(datos: EditarPerfil, imagen?: File) {
        const formData = new FormData();

        formData.append('nombre', datos.nombre);
        formData.append('apellido', datos.apellido);
        formData.append('email', datos.email);
        formData.append('nombreUsuario', datos.nombreUsuario);
        formData.append('fechaNacimiento', datos.fechaNacimiento);
        formData.append('descripcionBreve', datos.descripcionBreve);

        if (imagen) {
            formData.append('imagenPerfil', imagen);
        }

        const headers = new HttpHeaders({
            Authorization: `Bearer ${this.accesToken() ?? ''}`
        });

        return this.http.put<Usuario>(environment.apiUrl + '/usuarios/me', formData, { headers }).pipe(
            tap((usuario) => {
                this.currentUser.set(usuario);
                this.currentUserData.set(usuario);
            })
        );
    }

    signOut() {
        this.detenerContador();
        localStorage.removeItem(this.key);
        this.currentUser.set(null);
        this.currentUserData.set(null);
    }
}