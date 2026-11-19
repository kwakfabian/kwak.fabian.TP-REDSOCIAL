import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo } from 'mongoose';
import { Usuario } from './usuario.schema.js';
import { ImagenesService } from '../auth/imagenes.service.js';
import { EditarPerfilDto } from './usuarios.dto.js';

@Injectable()
export class UsuariosService {

  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarios: Model<Usuario>,
    private readonly imagenes: ImagenesService
  ) {}

  async editarPerfil(id: string, datos: EditarPerfilDto, imagen?: Express.Multer.File) {
    const usuario = await this.usuarios.findById(id).exec();

    if (!usuario) {
      throw new UnauthorizedException('El usuario no existe');
    }

    let subida: { url: string; publicId: string } | undefined;

    try {
      if (imagen) {
        subida = await this.imagenes.subirPerfil(imagen);
      }

      usuario.nombre = datos.nombre;
      usuario.apellido = datos.apellido;
      usuario.email = datos.email;
      usuario.nombreUsuario = datos.nombreUsuario;
      usuario.fechaNacimiento = new Date(datos.fechaNacimiento);
      usuario.descripcionBreve = datos.descripcionBreve;

      if (subida) {
        usuario.imagenPerfil = subida.url;
      }

      await usuario.save();
    } catch (error) {
      if (subida) {
        await this.imagenes.eliminar(subida.publicId);
      }

      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        throw new ConflictException('El email o nombre de usuario ya está registrado');
      }

      throw error;
    }

    return {
      id: usuario.id as string,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      nombreUsuario: usuario.nombreUsuario,
      fechaNacimiento: usuario.fechaNacimiento,
      descripcionBreve: usuario.descripcionBreve,
      imagenPerfil: usuario.imagenPerfil,
      perfil: usuario.perfil
    };
  }
}