import { Directive, ElementRef, HostListener, inject, Renderer2 } from '@angular/core';

@Directive({
    selector: 'img[appImagenAlternativa]',
    standalone: true
})
export class ImagenAlternativaDirective {

    private elemento = inject<ElementRef<HTMLImageElement>>(ElementRef);
    private renderer = inject(Renderer2);

    private imagenAlternativa = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
            <rect width="160" height="160" rx="80" fill="#242424"/>
            <circle cx="80" cy="58" r="27" fill="#55b5ff"/>
            <path d="M30 140c0-30 20-49 50-49s50 19 50 49" fill="#55b5ff"/>
        </svg>
    `);

    @HostListener('error')
    mostrarAlternativa() {
        const imagen = this.elemento.nativeElement;

        if (imagen.getAttribute('src') === this.imagenAlternativa) return;

        this.renderer.setAttribute(imagen, 'src', this.imagenAlternativa);
    }
}