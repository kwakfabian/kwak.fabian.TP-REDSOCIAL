import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publicaciones } from './publicaciones.schema.js';
import { CrearPublicacionesDto } from './publicaciones.dto.js';
import { Usuario } from '../usuarios/usuario.schema.js';
import { ImagenesService } from '../auth/imagenes.service.js';

@Injectable()
export class PublicacionesService {

  constructor(
    @InjectModel(Publicaciones.name)
    private readonly publicaciones: Model<Publicaciones>,

    @InjectModel(Usuario.name)
    private readonly usuarios: Model<Usuario>,

    private readonly imagenesService: ImagenesService
  ) {}

  async crear(datos: CrearPublicacionesDto, usuarioId: string, imagen?: Express.Multer.File) {
    let subida: { url: string; publicId: string } | undefined;

    try {
      if(imagen) {
        subida = await this.imagenesService.subirPerfil(imagen);
      }

      const publicaciones = await this.publicaciones.create({
        usuarioId: new Types.ObjectId(usuarioId),
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        imagenUrl: subida?.url ?? '',
        likes: [],
        activa: true
      });

      return publicaciones;
    } catch(error) {
      if(subida) {
        try {
          await this.imagenesService.eliminar(subida.publicId);
        } catch(errorEliminar) {
          console.error('Error al eliminar imagen de Cloudinary:', errorEliminar);
        }
      }
      throw error;
    }
  }

  async listar(orden: string = 'fecha', offset: number = 0, limit: number = 10, usuarioId?: string) {
    const filtro: Record<string, unknown> = { activa: true };

    if(usuarioId) {
      if (!Types.ObjectId.isValid(usuarioId)) {
        throw new BadRequestException('ID de usuario invalido');
      }
      filtro.usuarioId = new Types.ObjectId(usuarioId);
    }

    if(!['fecha', 'likes'].includes(orden)) {
      throw new BadRequestException('El orden debe ser de fecha o likes');
    }

    if(!Number.isInteger(offset) || offset < 0) {
      throw new BadRequestException('Offset debe ser un numero entero mayor o igual a 0');
    }

    if(!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('El limite debe ser un numero entero entre 1 y 100');
    }

    const ordenamiento = orden === 'likes' ? { cantidadLikes: -1, createdAt: -1 } : { createdAt: -1 };

    const publicaciones = await this.publicaciones.aggregate([
      { $match: filtro },
      { $addFields: {
          cantidadLikes: { $size: '$likes' }
        }
      },
      { $sort: ordenamiento as Record<string, 1 | -1> },
      { $skip: offset },
      { $limit: limit }
    ]);

    const total = await this.publicaciones.countDocuments(filtro);

    const usuarios = await this.usuarios.find({
      _id: { $in: publicaciones.map(publicacion => publicacion.usuarioId) }
    }).select('nombreUsuario imagenPerfil').lean().exec();

    const autores = new Map(usuarios.map(usuario => [
      usuario._id.toString(),
      usuario
    ]));

    const publicacionesConAutores = publicaciones.map(publicacion => {
      const autor = autores.get(publicacion.usuarioId.toString());

      return {
        ...publicacion,
        nombreUsuario: autor?.nombreUsuario ?? null,
        imagenPerfil: autor?.imagenPerfil ?? null
      };
    });

    return { publicaciones: publicacionesConAutores, total, offset, limit };
  }

  async obtenerPorId(id: string) {
    if(!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de publicacion invalido');
    }

    const publicacion = await this.publicaciones.findOne({
      _id: id,
      activa: true
    }).exec();

    if(!publicacion) {
      throw new NotFoundException('No existe la publicacion');
    }

    const autor = await this.usuarios.findById(publicacion.usuarioId)
      .select('nombreUsuario imagenPerfil').lean().exec();

    return {
      ...publicacion.toObject(),
      cantidadLikes: publicacion.likes.length,
      nombreUsuario: autor?.nombreUsuario ?? null,
      imagenPerfil: autor?.imagenPerfil ?? null
    };
  }

  async eliminar(id: string, usuarioId: string) {
    if(!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de publicacion invalido');
    }

    const publicacion = await this.publicaciones.findOne({
      _id: id,
      activa: true
    }).exec();

    if (!publicacion) {
      throw new NotFoundException('No existe la publicacion');
    }

    const usuario = await this.usuarios.findById(usuarioId).exec();

    if (!usuario) {
      throw new NotFoundException('No existe el usuario');
    }

    if (publicacion.usuarioId.toString() !== usuarioId && usuario.perfil !== 'administrador') {
      throw new ForbiddenException('No tienes permiso para eliminar esta publicacion');
    }

    await this.publicaciones.findOneAndUpdate(
      { _id: id, activa: true },
      { $set: { activa: false } },
      { new: true }
    ).exec();

    return { mensaje: 'Publicacion eliminada correctamente' };
  }

  async darLike(id: string, usuarioId: string) {
    if(!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de publicacion invalida');
    }

    const publicacion = await this.publicaciones.findOneAndUpdate(
      { _id: id, activa: true },
      {
        $addToSet: {
          likes: new Types.ObjectId(usuarioId)
        }
      },
      { new: true }
    ).exec();

    if(!publicacion) {
      throw new NotFoundException('La publicacion no existe');
    }

    return {
      mensaje: 'Like registrado correctamente',
      cantidadLikes: publicacion.likes.length
    };
  }

  async quitarLike(id: string, usuarioId: string) {
    if(!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de publicacion invalida');
    }

    const publicacion = await this.publicaciones.findOneAndUpdate(
      {
        _id: id,
        activa: true,
        likes: new Types.ObjectId(usuarioId)
      },
      {
        $pull: {
          likes: new Types.ObjectId(usuarioId)
        }
      },
      { new: true }
    ).exec();

    if(!publicacion) {
      throw new NotFoundException('La publicacion no existe o el usuario no dio like');
    }

    return {
      mensaje: 'Like eliminado correctamente',
      cantidadLikes: publicacion.likes.length
    };
  }
}