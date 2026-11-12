import { Component, computed, inject } from '@angular/core';
import { isActive, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/service/auth.service';

@Component({
    imports: [RouterLink, RouterLinkActive],
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