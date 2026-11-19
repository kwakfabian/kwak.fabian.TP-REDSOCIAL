import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {path: '', redirectTo: 'login', pathMatch: 'full'},

  {path: 'login', loadComponent:()=> import('./features/auth/login/login').then(c => c.Login)},
  {path: 'register', loadComponent:()=> import('./features/auth/register/register').then(c => c.Register)},
  {path: 'publicaciones', canActivate: [authGuard], loadComponent:()=> import('./features/publicaciones/publicaciones').then(c => c.Publicaciones)},
  {path: 'publicaciones/:id', canActivate: [authGuard], loadComponent:()=> import('./features/detalle-publicacion/detalle-publicacion').then(c => c.DetallePublicacion)},
  {path: 'mi-perfil', canActivate: [authGuard], loadComponent:()=> import('./features/mi-perfil/mi-perfil').then(c => c.MiPerfil)},
  {path: '**', redirectTo: 'login'}
];