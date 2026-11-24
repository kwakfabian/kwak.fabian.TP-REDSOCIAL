import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo, Types } from 'mongoose';
import { Usuario } from './usuario.schema.js';
import { ImagenesService } from '../auth/imagenes.service.js';
import { CrearUsuarioDto, EditarPerfilDto } from './usuarios.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {

  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarios: Model<Usuario>,
    private readonly imagenes: ImagenesService
  ) {}

  async listar() {
    const usuarios = await this.usuarios.find()
      .select('nombre apellido email nombreUsuario fechaNacimiento descripcionBreve imagenPerfil perfil activo')
      .sort({ nombreUsuario: 1, _id: 1 })
      .lean()
      .exec();

    return usuarios.map(usuario => ({
      id: usuario._id.toString(),
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      nombreUsuario: usuario.nombreUsuario,
      fechaNacimiento: usuario.fechaNacimiento,
      descripcionBreve: usuario.descripcionBreve,
      imagenPerfil: usuario.imagenPerfil,
      perfil: usuario.perfil,
      activo: usuario.activo !== false
    }));
  }

  async crear(datos: CrearUsuarioDto, imagen?: Express.Multer.File) {
    if (datos.password !== datos.repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    let subida: { url: string; publicId: string } | undefined;

    try {
      const passwordHash = await bcrypt.hash(datos.password, 10);

      if (imagen) {
        subida = await this.imagenes.subirPerfil(imagen);
      }

      const usuario = await this.usuarios.create({
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        nombreUsuario: datos.nombreUsuario,
        passwordHash,
        fechaNacimiento: new Date(datos.fechaNacimiento),
        descripcionBreve: datos.descripcionBreve,
        imagenPerfil: subida?.url ?? '',
        perfil: datos.perfil,
        activo: true
      });

      return {
        id: usuario.id as string,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        nombreUsuario: usuario.nombreUsuario,
        fechaNacimiento: usuario.fechaNacimiento,
        descripcionBreve: usuario.descripcionBreve,
        imagenPerfil: usuario.imagenPerfil,
        perfil: usuario.perfil,
        activo: usuario.activo
      };
    } catch (error) {
      if (subida) {
        await this.imagenes.eliminar(subida.publicId);
      }

      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        throw new ConflictException('El email o nombre de usuario ya está registrado');
      }

      throw error;
    }
  }

  async deshabilitar(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const usuario = await this.usuarios.findByIdAndUpdate(
      id,
      { $set: { activo: false } },
      { new: true }
    ).exec();

    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }

    return {
      mensaje: 'Usuario deshabilitado correctamente',
      id: usuario.id as string,
      activo: usuario.activo
    };
  }

  async habilitar(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }

    const usuario = await this.usuarios.findByIdAndUpdate(
      id,
      { $set: { activo: true } },
      { new: true }
    ).exec();

    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }

    return {
      mensaje: 'Usuario habilitado correctamente',
      id: usuario.id as string,
      activo: usuario.activo
    };
  }

  async editarPerfil(id: string, datos: EditarPerfilDto, imagen?: Express.Multer.File) {
    const usuario = await this.usuarios.findById(id).exec();

    if (!usuario) {
      throw new UnauthorizedException('El usuario no existe');
    }

    if (usuario.activo === false) {
      throw new UnauthorizedException('Tu usuario está deshabilitado. No estás autorizado a ingresar');
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
      perfil: usuario.perfil,
      activo: true
    };
  }
}