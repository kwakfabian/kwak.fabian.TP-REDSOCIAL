import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { RegistroDto } from './registro.dto.js';
import { AuthService } from './auth.service.js';
import { CredencialesDto } from './credenciales.dto.js';
import { JwtAuthGuard } from './jwt.auth.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @UseInterceptors(
    FileInterceptor('imagenPerfil', {
      storage: diskStorage({
        destination: './uploads/perfiles',
        filename: (req, file, callback) => {
          const nombre = randomUUID() + extname(file.originalname);
          callback(null, nombre);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
          return callback(
            new BadRequestException('Solo se permiten imágenes JPG, PNG o WEBP'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  registrar(
    @Body() datos: RegistroDto,
    @UploadedFile() imagen?: Express.Multer.File,
  ) {
    const imagenPerfil = imagen
      ? `/uploads/perfiles/${imagen.filename}`
      : '';

    return this.auth.registrar(datos, imagenPerfil);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() datos: CredencialesDto) {
    return this.auth.login(datos);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  perfil(@Req() req: Request & { user: { sub: string } }) {
    return this.auth.perfil(req.user.sub);
  }
}