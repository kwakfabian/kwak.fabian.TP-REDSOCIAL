import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'inicial',
    standalone: true
})
export class InicialPipe implements PipeTransform {

    transform(nombre: string | null | undefined): string {
        const texto = nombre?.trim();

        if (!texto) {
            return '?';
        }

        return texto.charAt(0).toUpperCase();
    }
}