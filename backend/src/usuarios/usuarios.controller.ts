import { BadRequestException, Body, Controller, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt.auth.guard.js';
import { EditarPerfilDto } from './usuarios.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {

    constructor(
        private readonly usuariosService: UsuariosService
    ) {}

    @Put('me')
    @UseInterceptors(
        FileInterceptor('imagenPerfil', {
            storage: memoryStorage(),
            limits: { fileSize: 5 * 1024 * 1024 },
            fileFilter: (req, file, callback) => {
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
                    return callback(
                        new BadRequestException('Solo se permiten imágenes JPG, PNG o WEBP'),
                        false
                    );
                }

                callback(null, true);
            }
        })
    )
    editarPerfil(
        @Body() datos: EditarPerfilDto,
        @Req() req: Request & { user: { sub: string } },
        @UploadedFile() imagen?: Express.Multer.File
    ) {
        return this.usuariosService.editarPerfil(req.user.sub, datos, imagen);
    }
}