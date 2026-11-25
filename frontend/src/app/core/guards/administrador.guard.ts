import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

export const administradorGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const usuario = authService.currentUserData();

    if (!authService.accesToken() || !usuario) {
        return router.createUrlTree(['/login']);
    }

    if (usuario.perfil !== 'administrador') {
        return router.createUrlTree(['/publicaciones']);
    }

    return true;
};