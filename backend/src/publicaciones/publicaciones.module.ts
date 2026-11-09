import { Module } from '@nestjs/common';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';

@Module({
  controllers: [PublicacionesController],
  providers: [PublicacionesService]
})
export class PublicacionesModule {}
