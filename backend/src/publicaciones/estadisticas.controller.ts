import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.auth.guard.js';
import { AdministradorGuard } from '../auth/administrador.guard.js';
import { EstadisticasService } from './estadisticas.service.js';

@Controller('estadisticas')
@UseGuards(JwtAuthGuard, AdministradorGuard)
export class EstadisticasController {

    constructor(
        private readonly estadisticasService: EstadisticasService
    ) {}

    @Get('publicaciones-por-usuario')
    publicacionesPorUsuario(
        @Query('desde') desde: string,
        @Query('hasta') hasta: string
    ) {
        return this.estadisticasService.publicacionesPorUsuario(desde, hasta);
    }

    @Get('comentarios-por-dia')
    comentariosPorDia(
        @Query('desde') desde: string,
        @Query('hasta') hasta: string
    ) {
        return this.estadisticasService.comentariosPorDia(desde, hasta);
    }

    @Get('comentarios-por-publicacion')
    comentariosPorPublicacion(
        @Query('desde') desde: string,
        @Query('hasta') hasta: string
    ) {
        return this.estadisticasService.comentariosPorPublicacion(desde, hasta);
    }
}