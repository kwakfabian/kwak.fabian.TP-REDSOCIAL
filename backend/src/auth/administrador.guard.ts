import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Request } from 'express';
import { Model } from 'mongoose';
import { Usuario } from '../usuarios/usuario.schema.js';

@Injectable()
export class AdministradorGuard implements CanActivate {

  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarios: Model<Usuario>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & {
      user?: { sub: string }
    }>();

    if (!req.user?.sub) {
      throw new UnauthorizedException('Debes iniciar sesión');
    }

    const usuario = await this.usuarios.findById(req.user.sub)
      .select('perfil activo').lean().exec();

    if (!usuario) {
      throw new UnauthorizedException('El usuario no existe');
    }

    if (usuario.activo === false) {
      throw new UnauthorizedException('Tu usuario está deshabilitado. No estás autorizado a ingresar');
    }

    if (usuario.perfil !== 'administrador') {
      throw new ForbiddenException('Solo los administradores pueden realizar esta acción');
    }

    return true;
  }
}