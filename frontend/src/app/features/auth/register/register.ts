import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiError } from '../../../core/service/api-error';
import { AuthService } from '../../../core/service/auth.service'

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-register',
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  fotoPerfil = signal<File | null>(null);

  registerForm = this.fb.group({
    nombre: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(15)
    ]],
    apellido: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(15)
    ]],
    email: ['', [
      Validators.required,
      Validators.email
    ]],
    nombreDeUsuario: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(20)
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
    ]],
    repetirpassword: ['', [
      Validators.required,
      Validators.minLength(8)
    ]],
    fechaDeNacimiento: ['', [
      Validators.required,
    ]],
    descripcionBreve: ['', [
      Validators.required,
      Validators.maxLength(200)
    ]]
  },
    {
    validators: (form: AbstractControl): ValidationErrors | null => {
      const password = form.get('password')?.value;
      const repetir = form.get('repetirpassword')?.value;

        return password === repetir ? null : { passwordDistintas: true };
    }
  });

  seleccionarFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    this.fotoPerfil.set(input.files?.[0] ?? null);
  }

  isLoading = signal(false);
  errorMessage = signal<string|null>(null);
  successMessage = signal<string|null>(null);

  onSubmit() {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const {nombre, apellido, email, nombreDeUsuario, password, repetirpassword, fechaDeNacimiento, descripcionBreve} = this.registerForm.value;

    this.authService.signUp({
      nombre: nombre!,
      apellido: apellido!,
      correo: email!,
      nombreDeUsuario: nombreDeUsuario!,
      password: password!,
      repetirPassword: repetirpassword!,
      fechaDeNacimiento: fechaDeNacimiento!,
      descripcionBreve: descripcionBreve!,
      fotoPerfil: this.fotoPerfil()
    }).subscribe({
      next: (sesion) => {
        this.authService.iniciarSesion(sesion.access_token).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigate(['/publicaciones']);
          },
          error: (error) => {
            this.authService.signOut();
            this.errorMessage.set(apiError(error));
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        this.errorMessage.set(apiError(error));
        this.isLoading.set(false);
      }
    });
  }
}