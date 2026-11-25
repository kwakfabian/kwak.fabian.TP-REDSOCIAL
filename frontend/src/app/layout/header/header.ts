import { Component, computed, inject } from '@angular/core';
import { isActive, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';
import { SoloAdministradorDirective } from '../../shared/directives/solo-administrador.directive';

@Component({
    imports: [RouterLink, RouterLinkActive, SoloAdministradorDirective],
    selector: 'app-header',
    styleUrl: './header.css',
    templateUrl: './header.html',
})
export class Header {

    private authService = inject(AuthService);
    public router = inject(Router);

    esLogin = isActive('/login', this.router);
    esRegister = isActive('/register', this.router);

    mostrarNavegacion = computed(() => {
        return this.router.lastSuccessfulNavigation() !== null && !this.esLogin() && !this.esRegister();
    });

    cerrarSesion() {
        this.authService.signOut();
        this.router.navigate(['/login']);
    }
}