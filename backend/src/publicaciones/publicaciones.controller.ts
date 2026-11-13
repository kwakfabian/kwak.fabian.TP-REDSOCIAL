import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { PublicacionesService } from './publicaciones.service.js';
import { CrearPublicacionesDto } from './publicaciones.dto.js';
import { JwtAuthGuard } from '../auth/jwt.auth.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('publicaciones')
export class PublicacionesController {

    constructor(
        private readonly publicacionesService: PublicacionesService
    ) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('imagen', {
            storage: memoryStorage(),
            limits: { fileSize: 5 * 1024 * 1024 },
            fileFilter: (req, file, callback) => {
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
                    return callback(
                        new BadRequestException('Solo se permiten imagenes tipo JPEG, PNG o WEBP'),
                        false
                    );
                }
                callback(null, true);
            }
        })
    )
    crear(
        @Body() datos: CrearPublicacionesDto,
        @Req() req: Request & { user: { sub: string } },
        @UploadedFile() imagen?: Express.Multer.File
    ) {
        return this.publicacionesService.crear(datos, req.user.sub, imagen);
    }

    @Get()
    listar(
        @Query('orden') orden: string = 'fecha',
        @Query('offset') offset: string = '0',
        @Query('limit') limit: string = '10',
        @Query('usuarioId') usuarioId?: string
    ) {
        return this.publicacionesService.listar(
            orden,
            Number(offset),
            Number(limit),
            usuarioId
        );
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    obtenerPorId(
        @Param('id') id: string
    ) {
        return this.publicacionesService.obtenerPorId(id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    eliminar(
        @Param('id') id: string,
        @Req() req: Request & { user: { sub: string } }
    ) {
        return this.publicacionesService.eliminar(id, req.user.sub);
    }

    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    darLike(
        @Param('id') id: string,
        @Req() req: Request & { user: { sub: string } }
    ) {
        return this.publicacionesService.darLike(id, req.user.sub);
    }

    @Delete('/:id/like')
    @UseGuards(JwtAuthGuard)
    quitarLike(
        @Param('id') id: string,
        @Req() req: Request & { user: { sub: string } }
    ) {
        return this.publicacionesService.quitarLike(id, req.user.sub);
    }
}