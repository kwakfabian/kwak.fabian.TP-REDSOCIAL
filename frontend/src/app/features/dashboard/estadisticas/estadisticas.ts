import { Component, DestroyRef, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import Chart from 'chart.js/auto';
import { ComentariosPorDia, ComentariosPorPublicacion, EstadisticasService, PublicacionesPorUsuario } from '../../../core/service/estadisticas.service';
import { apiError } from '../../../core/service/api-error';

@Component({
  imports: [ReactiveFormsModule, DatePipe],
  selector: 'app-estadisticas',
  styleUrl: './estadisticas.css',
  templateUrl: './estadisticas.html',
})
export class Estadisticas implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private estadisticasService = inject(EstadisticasService);
  private destroyRef = inject(DestroyRef);

  private graficoPublicaciones?: Chart<'bar'>;
  private graficoComentarios?: Chart<'line'>;
  private graficoPorPublicacion?: Chart<'pie'>;

  cargando = signal(false);
  mensajeError = signal<string|null>(null);
  consultado = signal(false);

  publicacionesPorUsuario = signal<PublicacionesPorUsuario[]>([]);
  comentariosPorDia = signal<ComentariosPorDia[]>([]);
  comentariosPorPublicacion = signal<ComentariosPorPublicacion[]>([]);

  totalPublicaciones = signal(0);
  totalComentarios = signal(0);

  desdeConsultado = signal('');
  hastaConsultado = signal('');

  filtroForm = this.fb.nonNullable.group({
    desde: ['', [Validators.required]],
    hasta: ['', [Validators.required]]
  }, {
    validators: (form: AbstractControl): ValidationErrors | null => {
      const desde = form.get('desde')?.value;
      const hasta = form.get('hasta')?.value;

      return desde && hasta && desde > hasta ? { periodoInvalido: true } : null;
    }
  });

  @ViewChild('canvasPublicaciones')
  set canvasPublicaciones(elemento: ElementRef<HTMLCanvasElement> | undefined) {
    this.graficoPublicaciones?.destroy();
    this.graficoPublicaciones = undefined;

    if (!elemento) return;

    const datos = this.publicacionesPorUsuario();

    this.graficoPublicaciones = new Chart(elemento.nativeElement, {
      type: 'bar',
      data: {
        labels: datos.map(dato => '@' + dato.nombreUsuario),
        datasets: [{
          label: 'Publicaciones',
          data: datos.map(dato => dato.cantidad),
          backgroundColor: '#008cff',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { color: '#bbbbbb' },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#bbbbbb', precision: 0 },
            grid: { color: '#292929' }
          }
        }
      }
    });
  }

  @ViewChild('canvasComentarios')
  set canvasComentarios(elemento: ElementRef<HTMLCanvasElement> | undefined) {
    this.graficoComentarios?.destroy();
    this.graficoComentarios = undefined;

    if (!elemento) return;

    const datos = this.comentariosPorDia();

    this.graficoComentarios = new Chart(elemento.nativeElement, {
      type: 'line',
      data: {
        labels: datos.map(dato => dato.fecha.split('-').reverse().join('/')),
        datasets: [{
          label: 'Comentarios',
          data: datos.map(dato => dato.cantidad),
          borderColor: '#6edba8',
          backgroundColor: 'rgba(110, 219, 168, 0.12)',
          pointBackgroundColor: '#6edba8',
          pointRadius: 3,
          fill: true,
          tension: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { color: '#bbbbbb', maxTicksLimit: 10 },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#bbbbbb', precision: 0 },
            grid: { color: '#292929' }
          }
        }
      }
    });
  }

  @ViewChild('canvasPorPublicacion')
  set canvasPorPublicacion(elemento: ElementRef<HTMLCanvasElement> | undefined) {
    this.graficoPorPublicacion?.destroy();
    this.graficoPorPublicacion = undefined;

    if (!elemento) return;

    const datos = this.comentariosPorPublicacion();
    const colores = datos.map((dato, indice) =>
      `hsl(${Math.round(indice * 360 / datos.length)}, 70%, 60%)`
    );

    this.graficoPorPublicacion = new Chart(elemento.nativeElement, {
      type: 'pie',
      data: {
        labels: datos.map((dato, indice) => `${indice + 1}. ${dato.titulo}`),
        datasets: [{
          label: 'Comentarios',
          data: datos.map(dato => dato.cantidad),
          backgroundColor: colores,
          borderColor: '#111111',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  ngOnInit() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    this.filtroForm.setValue({
      desde: `${anio}-${mes}-01`,
      hasta: `${anio}-${mes}-${dia}`
    });

    this.consultar();
  }

  consultar() {
    if (this.cargando()) return;

    this.filtroForm.markAllAsTouched();
    if (this.filtroForm.invalid) return;

    const { desde, hasta } = this.filtroForm.getRawValue();

    this.cargando.set(true);
    this.mensajeError.set(null);
    this.consultado.set(false);
    this.destruirGraficos();

    forkJoin({
      publicaciones: this.estadisticasService.publicacionesPorUsuario(desde, hasta),
      comentarios: this.estadisticasService.comentariosPorDia(desde, hasta),
      porPublicacion: this.estadisticasService.comentariosPorPublicacion(desde, hasta)
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (respuesta) => {
        this.publicacionesPorUsuario.set(respuesta.publicaciones.datos);
        this.comentariosPorDia.set(respuesta.comentarios.datos);
        this.comentariosPorPublicacion.set(respuesta.porPublicacion.datos);

        this.totalPublicaciones.set(respuesta.publicaciones.total);
        this.totalComentarios.set(respuesta.comentarios.total);

        this.desdeConsultado.set(desde);
        this.hastaConsultado.set(hasta);

        this.consultado.set(true);
        this.cargando.set(false);
      },
      error: (error) => {
        this.mensajeError.set(apiError(error));
        this.cargando.set(false);
      }
    });
  }

  private destruirGraficos() {
    this.graficoPublicaciones?.destroy();
    this.graficoComentarios?.destroy();
    this.graficoPorPublicacion?.destroy();

    this.graficoPublicaciones = undefined;
    this.graficoComentarios = undefined;
    this.graficoPorPublicacion = undefined;
  }

  ngOnDestroy() {
    this.destruirGraficos();
  }
}