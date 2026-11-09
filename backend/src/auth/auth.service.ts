import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, mongo } from 'mongoose';
import { Usuario } from './usuario.schema.js';
import { CredencialesDto } from './credenciales.dto.js';
import { RegistroDto } from './registro.dto.js';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarios: Model<Usuario>,
    private readonly jwt: JwtService,
  ) {}

  async registrar(datos: RegistroDto, imagenPerfil: string) {
    if (datos.password !== datos.repetirPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    try {
      const usuario = await this.usuarios.create({
        email: datos.email,
        nombre: datos.nombre,
        apellido: datos.apellido,
        nombreUsuario: datos.nombreUsuario,
        passwordHash: await bcrypt.hash(datos.password, 10),
        fechaNacimiento: new Date(datos.fechaNacimiento),
        descripcionBreve: datos.descripcionBreve,
        imagenPerfil,
        perfil: 'usuario',
      });

      return {
        ...(await this.token(usuario.id as string, usuario.email)),
        usuario: await this.perfil(usuario.id as string),
      };
    } catch (error) {
      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        throw new ConflictException(
          'El email o nombre de usuario ya está registrado',
        );
      }
      throw error;
    }
  }

  async login(datos: CredencialesDto) {
    const usuario = await this.usuarios
      .findOne({ email: datos.email })
      .select('+passwordHash')
      .exec();

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(
      datos.password,
      usuario.passwordHash,
    );

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      ...(await this.token(usuario.id as string, usuario.email)),
      usuario: await this.perfil(usuario.id as string),
    };
  }

  private async token(id: string, email: string) {
    return {
      access_token: await this.jwt.signAsync({ sub: id, email }),
      token_type: 'Bearer',
      expires_in: 3600,
    };
  }

  async perfil(id: string) {
    const usuario = await this.usuarios.findById(id).exec();

    if (!usuario) {
      throw new UnauthorizedException('El usuario no existe');
    }

    return {
      id: usuario.id as string,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      nombreUsuario: usuario.nombreUsuario,
      fechaNacimiento: usuario.fechaNacimiento,
      descripcionBreve: usuario.descripcionBreve,
      imagenPerfil: usuario.imagenPerfil,
      perfil: usuario.perfil,
    };
  }
}