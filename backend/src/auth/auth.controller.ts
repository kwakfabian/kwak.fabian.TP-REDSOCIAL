import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { RegistroDto } from './registro.dto.js';
import { AuthService } from './auth.service.js';
import { CredencialesDto } from './credenciales.dto.js';
import { JwtAuthGuard } from './jwt.auth.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @UseInterceptors(
    FileInterceptor('imagenPerfil', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
        ) {
          return callback(
            new BadRequestException(
              'Solo se permiten imágenes JPG, PNG o WEBP',
            ),
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
    return this.auth.registrar(datos, imagen);
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