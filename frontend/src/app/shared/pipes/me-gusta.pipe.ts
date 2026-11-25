import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'meGusta',
    standalone: true
})
export class MeGustaPipe implements PipeTransform {

    transform(cantidad: number | null | undefined): string {
        if (cantidad == null || !Number.isFinite(cantidad) || cantidad <= 0) {
            return 'Sin me gusta';
        }

        return `${cantidad} me gusta`;
    }
}