import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Usuario } from '../usuarios/usuario.schema.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarios: Model<Usuario>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
      ignoreExpiration: false,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: { sub: string; email: string; perfil: string }) {
    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      !Types.ObjectId.isValid(payload.sub) ||
      typeof payload.email !== 'string' ||
      !['usuario', 'administrador'].includes(payload.perfil)
    ) {
      throw new UnauthorizedException('Token inválido');
    }

    const usuario = await this.usuarios.findById(payload.sub)
      .select('email perfil activo').lean().exec();

    if (!usuario) {
      throw new UnauthorizedException('El usuario no existe');
    }

    if (usuario.activo === false) {
      throw new UnauthorizedException('Tu usuario está deshabilitado. No estás autorizado a ingresar');
    }

    return {
      sub: usuario._id.toString(),
      email: usuario.email,
      perfil: usuario.perfil
    };
  }
}