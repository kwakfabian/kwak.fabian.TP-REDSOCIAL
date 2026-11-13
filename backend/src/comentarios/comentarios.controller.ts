import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ComentariosService } from './comentarios.service.js';
import { ComentariosDto } from './comentarios.dto.js';
import { JwtAuthGuard } from '../auth/jwt.auth.guard.js';

@Controller('comentarios')
@UseGuards(JwtAuthGuard)
export class ComentariosController {

    constructor(
        private readonly comentariosService: ComentariosService
    ) {}

    @Post('publicacion/:publicacionId')
    crear(
        @Param('publicacionId') publicacionId: string,
        @Body() datos: ComentariosDto,
        @Req() req: Request & { user: { sub: string } }
    ) {
        return this.comentariosService.crear(publicacionId, datos, req.user.sub);
    }

    @Get('publicacion/:publicacionId')
    listar(
        @Param('publicacionId') publicacionId: string,
        @Query('offset') offset: string = '0',
        @Query('limit') limit: string = '5'
    ) {
        return this.comentariosService.listar(
            publicacionId,
            Number(offset),
            Number(limit)
        );
    }

    @Put(':id')
    editar(
        @Param('id') id: string,
        @Body() datos: ComentariosDto,
        @Req() req: Request & { user: { sub: string } }
    ) {
        return this.comentariosService.editar(id, datos, req.user.sub);
    }
}