import { Directive, effect, inject, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/service/auth.service';

@Directive({
    selector: '[appSoloAdministrador]',
    standalone: true
})
export class SoloAdministradorDirective {

    private authService = inject(AuthService);
    private template = inject(TemplateRef<unknown>);
    private contenedor = inject(ViewContainerRef);
    private visible = false;

    constructor() {
        effect(() => {
            const esAdministrador = this.authService.currentUserData()?.perfil === 'administrador';

            if (esAdministrador && !this.visible) {
                this.contenedor.createEmbeddedView(this.template);
                this.visible = true;
            } else if (!esAdministrador && this.visible) {
                this.contenedor.clear();
                this.visible = false;
            }
        });
    }
}