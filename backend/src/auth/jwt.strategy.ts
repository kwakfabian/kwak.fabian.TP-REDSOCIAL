import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Types } from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
      ignoreExpiration: false,
      algorithms: ['HS256'],
    });
  }

  validate(payload: { sub: string; email: string; perfil: string }) {
    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      !Types.ObjectId.isValid(payload.sub) ||
      typeof payload.email !== 'string' ||
      !['usuario', 'administrador'].includes(payload.perfil)
    ) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      perfil: payload.perfil
    };
  }
}