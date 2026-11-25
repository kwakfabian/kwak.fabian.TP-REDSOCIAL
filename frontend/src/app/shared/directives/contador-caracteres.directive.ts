import { AfterViewInit, DestroyRef, Directive, ElementRef, HostListener, inject, Input, Renderer2 } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgControl } from '@angular/forms';

@Directive({
    selector: 'textarea[appContadorCaracteres]',
    standalone: true
})
export class ContadorCaracteresDirective implements AfterViewInit {

    private elemento = inject<ElementRef<HTMLTextAreaElement>>(ElementRef);
    private renderer = inject(Renderer2);
    private destroyRef = inject(DestroyRef);
    private control = inject(NgControl, { self: true, optional: true });

    @Input('appContadorCaracteres')
    contador!: HTMLElement;

    ngAfterViewInit() {
        this.actualizar(this.elemento.nativeElement.value);

        this.control?.control?.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(valor => {
                this.actualizar(typeof valor === 'string' ? valor : '');
            });
    }

    @HostListener('input')
    alEscribir() {
        this.actualizar(this.elemento.nativeElement.value);
    }

    private actualizar(valor: string) {
        const cantidad = valor.length;
        const limite = this.elemento.nativeElement.maxLength;

        const texto = limite >= 0
            ? `${cantidad} / ${limite} caracteres`
            : `${cantidad} caracteres`;

        this.renderer.setProperty(this.contador, 'textContent', texto);
        this.renderer.setStyle(this.contador, 'color', limite >= 0 && cantidad >= limite ? '#ff7777' : '#999999');
    }
}