import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, type PipelineStage } from 'mongoose';
import { Publicaciones } from './publicaciones.schema.js';
import { Comentarios } from '../comentarios/comentarios.schema.js';
import { Usuario } from '../usuarios/usuario.schema.js';

export interface PublicacionesPorUsuario {
  usuarioId: string;
  nombreUsuario: string;
  cantidad: number;
}

export interface ComentariosPorDia {
  fecha: string;
  cantidad: number;
}

export interface ComentariosPorPublicacion {
  publicacionId: string;
  titulo: string;
  cantidad: number;
}

@Injectable()
export class EstadisticasService {

  constructor(
    @InjectModel(Publicaciones.name)
    private readonly publicaciones: Model<Publicaciones>,

    @InjectModel(Comentarios.name)
    private readonly comentarios: Model<Comentarios>,

    @InjectModel(Usuario.name)
    private readonly usuarios: Model<Usuario>
  ) {}

  async publicacionesPorUsuario(desde: string, hasta: string) {
    const { inicio, fin } = this.obtenerPeriodo(desde, hasta);

    const datos = await this.publicaciones.aggregate<PublicacionesPorUsuario>([
      {
        $match: {
          activa: true,
          createdAt: { $gte: inicio, $lt: fin }
        }
      },
      {
        $group: {
          _id: '$usuarioId',
          cantidad: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: this.usuarios.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'autor'
        }
      },
      {
        $project: {
          _id: 0,
          usuarioId: { $toString: '$_id' },
          nombreUsuario: {
            $ifNull: [
              { $arrayElemAt: ['$autor.nombreUsuario', 0] },
              'Usuario no disponible'
            ]
          },
          cantidad: 1
        }
      },
      { $sort: { cantidad: -1, nombreUsuario: 1, usuarioId: 1 } }
    ]).exec();

    return {
      desde,
      hasta,
      total: datos.reduce((total, dato) => total + dato.cantidad, 0),
      datos
    };
  }

  async comentariosPorDia(desde: string, hasta: string) {
    const { inicio, fin } = this.obtenerPeriodo(desde, hasta);

    const comentarios = await this.comentarios.aggregate<ComentariosPorDia>([
      ...this.filtrarComentarios(inicio, fin),
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: '-03:00'
            }
          },
          cantidad: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          fecha: '$_id',
          cantidad: 1
        }
      },
      { $sort: { fecha: 1 } }
    ]).exec();

    const cantidades = new Map(comentarios.map(comentario => [
      comentario.fecha,
      comentario.cantidad
    ]));

    const datos: ComentariosPorDia[] = [];

    for (let tiempo = inicio.getTime(); tiempo < fin.getTime(); tiempo += 86400000) {
      const fecha = new Date(tiempo - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

      datos.push({
        fecha,
        cantidad: cantidades.get(fecha) ?? 0
      });
    }

    return {
      desde,
      hasta,
      total: datos.reduce((total, dato) => total + dato.cantidad, 0),
      datos
    };
  }

  async comentariosPorPublicacion(desde: string, hasta: string) {
    const { inicio, fin } = this.obtenerPeriodo(desde, hasta);

    const datos = await this.comentarios.aggregate<ComentariosPorPublicacion>([
      ...this.filtrarComentarios(inicio, fin),
      {
        $group: {
          _id: '$publicacionId',
          titulo: { $first: '$publicacion.titulo' },
          cantidad: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          publicacionId: { $toString: '$_id' },
          titulo: 1,
          cantidad: 1
        }
      },
      { $sort: { cantidad: -1, titulo: 1, publicacionId: 1 } }
    ]).exec();

    return {
      desde,
      hasta,
      total: datos.reduce((total, dato) => total + dato.cantidad, 0),
      datos
    };
  }

  private filtrarComentarios(inicio: Date, fin: Date): PipelineStage[] {
    return [
      {
        $match: {
          createdAt: { $gte: inicio, $lt: fin }
        }
      },
      {
        $lookup: {
          from: this.publicaciones.collection.name,
          localField: 'publicacionId',
          foreignField: '_id',
          as: 'publicacion'
        }
      },
      { $unwind: '$publicacion' },
      { $match: { 'publicacion.activa': true } }
    ];
  }

  private obtenerPeriodo(desde: string, hasta: string) {
    const fechaDesde = this.validarFecha(desde);
    const fechaHasta = this.validarFecha(hasta);

    if (fechaDesde.getTime() > fechaHasta.getTime()) {
      throw new BadRequestException('La fecha desde no puede ser posterior a la fecha hasta');
    }

    const diferenciaHoraria = 3 * 60 * 60 * 1000;
    const unDia = 24 * 60 * 60 * 1000;

    const inicio = new Date(fechaDesde.getTime() + diferenciaHoraria);
    const fin = new Date(fechaHasta.getTime() + diferenciaHoraria + unDia);

    return { inicio, fin };
  }

  private validarFecha(valor: string): Date {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      throw new BadRequestException('Debes enviar desde y hasta con formato YYYY-MM-DD');
    }

    const fecha = new Date(`${valor}T00:00:00.000Z`);

    if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) {
      throw new BadRequestException('Las fechas ingresadas no son válidas');
    }

    return fecha;
  }
}