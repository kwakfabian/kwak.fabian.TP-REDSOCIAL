import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'nombreUsuario',
    standalone: true
})
export class NombreUsuarioPipe implements PipeTransform {

    transform(nombre: string | null | undefined): string {
        const nombreUsuario = nombre?.trim();

        if (!nombreUsuario) {
            return 'Usuario no disponible';
        }

        return `@${nombreUsuario}`;
    }
}