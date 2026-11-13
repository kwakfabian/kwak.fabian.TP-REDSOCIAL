import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comentarios } from './comentarios.schema.js';
import { ComentariosDto } from './comentarios.dto.js';
import { Publicaciones } from '../publicaciones/publicaciones.schema.js';

@Injectable()
export class ComentariosService {

  constructor(
    @InjectModel(Comentarios.name)
    private readonly comentarios: Model<Comentarios>,

    @InjectModel(Publicaciones.name)
    private readonly publicaciones: Model<Publicaciones>
  ) {}

  async crear(publicacionId: string, datos: ComentariosDto, usuarioId: string) {
    if(!Types.ObjectId.isValid(publicacionId)) {
      throw new BadRequestException('ID de publicacion invalido');
    }

    const publicacion = await this.publicaciones.findOne({
      _id: publicacionId,
      activa: true
    }).exec();

    if(!publicacion) {
      throw new NotFoundException('No existe la publicacion');
    }

    const comentario = await this.comentarios.create({
      publicacionId: new Types.ObjectId(publicacionId),
      usuarioId: new Types.ObjectId(usuarioId),
      mensaje: datos.mensaje.trim(),
      modificado: false
    });

    return comentario;
  }

  async listar(publicacionId: string, offset: number = 0, limit: number = 5) {
    if(!Types.ObjectId.isValid(publicacionId)) {
      throw new BadRequestException('ID de publicacion invalido');
    }

    if(!Number.isInteger(offset) || offset < 0) {
      throw new BadRequestException('Offset debe ser un numero entero mayor o igual a 0');
    }

    if(!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('El limite debe ser un numero entero entre 1 y 100');
    }

    const publicacion = await this.publicaciones.findOne({
      _id: publicacionId,
      activa: true
    }).exec();

    if(!publicacion) {
      throw new NotFoundException('No existe la publicacion');
    }

    const filtro = { publicacionId: new Types.ObjectId(publicacionId) };

    const comentarios = await this.comentarios.find(filtro)
      .sort({ createdAt: -1, _id: -1 })
      .skip(offset)
      .limit(limit)
      .exec();

    const total = await this.comentarios.countDocuments(filtro);

    return { comentarios, total, offset, limit };
  }

  async editar(id: string, datos: ComentariosDto, usuarioId: string) {
    if(!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de comentario invalido');
    }

    const comentario = await this.comentarios.findById(id).exec();

    if(!comentario) {
      throw new NotFoundException('No existe el comentario');
    }

    if(comentario.usuarioId.toString() !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para editar este comentario');
    }

    const publicacion = await this.publicaciones.findOne({
      _id: comentario.publicacionId,
      activa: true
    }).exec();

    if(!publicacion) {
      throw new NotFoundException('No existe la publicacion');
    }

    comentario.mensaje = datos.mensaje.trim();
    comentario.modificado = true;

    await comentario.save();

    return comentario;
  }
}