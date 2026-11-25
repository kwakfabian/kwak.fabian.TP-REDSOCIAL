import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../../core/service/auth.service';
import { UsuarioAdministracion, UsuariosService } from '../../../core/service/usuarios.service';
import { apiError } from '../../../core/service/api-error';
import { environment } from '../../../../environments/environment';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-usuarios-dashboard',
  styleUrl: './usuarios.css',
  templateUrl: './usuarios.html',
})
export class UsuariosDashboard implements OnInit {

  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  usuarios = signal<UsuarioAdministracion[]>([]);
  cargando = signal(true);
  errorListado = signal<string|null>(null);
  successMessage = signal<string|null>(null);

  fotoPerfil = signal<File|null>(null);
  errorImagen = signal<string|null>(null);
  isLoading = signal(false);
  errorMessage = signal<string|null>(null);

  usuarioSeleccionado = signal<UsuarioAdministracion|null>(null);
  cambiandoEstado = signal(false);
  errorEstado = signal<string|null>(null);

  usuarioForm = this.fb.nonNullable.group({
    nombre: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(15),
      Validators.pattern(/\S/)
    ]],
    apellido: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(15),
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
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
    ]],
    repetirPassword: ['', [
      Validators.required,
      Validators.minLength(8)
    ]],
    fechaNacimiento: ['', [
      Validators.required
    ]],
    descripcionBreve: ['', [
      Validators.required,
      Validators.maxLength(200),
      Validators.pattern(/\S/)
    ]],
    perfil: this.fb.nonNullable.control<'usuario' | 'administrador'>('usuario', [
      Validators.required
    ])
  }, {
    validators: (form: AbstractControl): ValidationErrors | null => {
      const password = form.get('password')?.value;
      const repetir = form.get('repetirPassword')?.value;

      return password === repetir ? null : { passwordDistintas: true };
    }
  });

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.cargando.set(true);
    this.errorListado.set(null);

    this.usuariosService.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorListado.set(apiError(error));
        this.cargando.set(false);
      }
    });
  }

  obtenerUrlImagen(ruta: string): string {
    if (!ruta) return '';
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;

    return `${environment.apiUrl}/${ruta.replace(/^\/+/, '')}`;
  }

  abrirCrear(modal: HTMLDialogElement, input: HTMLInputElement) {
    this.usuarioForm.reset();
    this.fotoPerfil.set(null);
    this.errorImagen.set(null);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    input.value = '';

    modal.showModal();
  }

  cerrarCrear(modal: HTMLDialogElement) {
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

    const valores = this.usuarioForm.getRawValue();

    this.usuarioForm.patchValue({
      nombre: valores.nombre.trim(),
      apellido: valores.apellido.trim(),
      email: valores.email.trim(),
      nombreUsuario: valores.nombreUsuario.trim(),
      descripcionBreve: valores.descripcionBreve.trim()
    });

    this.usuarioForm.markAllAsTouched();
    if (this.usuarioForm.invalid || this.errorImagen()) return;

    const datos = this.usuarioForm.getRawValue();

    if (new TextEncoder().encode(datos.password).length > 72) {
      this.errorMessage.set('La contraseña no puede superar los 72 bytes.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.usuariosService.crear(datos, this.fotoPerfil() ?? undefined)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (usuario) => {
          this.usuarios.update(actuales =>
            [...actuales, usuario].sort((a, b) => a.nombreUsuario.localeCompare(b.nombreUsuario))
          );

          this.isLoading.set(false);
          this.cerrarCrear(modal);
          this.successMessage.set('Usuario creado correctamente.');
        },
        error: (error) => {
          this.errorMessage.set(apiError(error));
          this.isLoading.set(false);
        }
      });
  }

  abrirEstado(usuario: UsuarioAdministracion, modal: HTMLDialogElement) {
    if (this.cambiandoEstado()) return;

    this.usuarioSeleccionado.set(usuario);
    this.errorEstado.set(null);
    this.successMessage.set(null);

    modal.showModal();
  }

  cerrarEstado(modal: HTMLDialogElement) {
    if (this.cambiandoEstado()) return;

    modal.close();
    this.usuarioSeleccionado.set(null);
  }

  confirmarEstado(modal: HTMLDialogElement) {
    const usuario = this.usuarioSeleccionado();
    if (!usuario || this.cambiandoEstado()) return;

    this.cambiandoEstado.set(true);
    this.errorEstado.set(null);

    const peticion = usuario.activo
      ? this.usuariosService.deshabilitar(usuario.id)
      : this.usuariosService.habilitar(usuario.id);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (respuesta) => {
        this.usuarios.update(actuales =>
          actuales.map(actual =>
            actual.id === respuesta.id ? { ...actual, activo: respuesta.activo } : actual
          )
        );

        this.cambiandoEstado.set(false);
        this.cerrarEstado(modal);
        this.successMessage.set(respuesta.mensaje);

        if (!respuesta.activo && respuesta.id === this.authService.currentUserData()?.id) {
          this.authService.finalizarSesion();
        }
      },
      error: (error) => {
        this.errorEstado.set(apiError(error));
        this.cambiandoEstado.set(false);
      }
    });
  }
}