import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/service/auth.service'
import { Router, RouterLink } from '@angular/router';
import { apiError } from '../../../core/service/api-error';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router)
  
  
  loginForm = this.fb.group({
      identificador: ['', [Validators.required]],
      password: ['', [Validators.required]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  get f(){
    return this.loginForm.controls;
  }

  onSubmit(){
    this.loginForm.markAllAsTouched();

    if(this.loginForm.invalid) return;
    
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const {identificador, password} = this.loginForm.value;

    this.authService.signIn(identificador!, password!).subscribe({
      next:(sesion) => {
        this.authService.iniciarSesion(sesion.access_token).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.router.navigate(['/publicaciones'])
          },
          error: (error) => {
            this.authService.signOut();
            this.errorMessage.set(apiError(error))
            this.isLoading.set(false);
          },
        });
      },
      error: (error) => {
        this.errorMessage.set(apiError(error));
        this.isLoading.set(false);
      }
    })
  }
}
