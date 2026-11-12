import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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

    cerrarSesion() {
        this.authService.signOut();
        this.router.navigate(['/login']);
    }
}