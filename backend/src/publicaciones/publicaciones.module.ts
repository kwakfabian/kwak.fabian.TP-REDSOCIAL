import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';
import { Publicaciones, PublicacionesSchema } from './publicaciones.schema.js';
import { Usuario, UsuarioSchema } from '../auth/usuario.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicaciones.name, schema: PublicacionesSchema },
      { name: Usuario.name, schema: UsuarioSchema}
    ])
  ],
  controllers: [PublicacionesController],
  providers: [PublicacionesService],
})
export class PublicacionesModule {}