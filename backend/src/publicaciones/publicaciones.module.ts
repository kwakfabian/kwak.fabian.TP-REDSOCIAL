import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';
import { Publicaciones, PublicacionesSchema } from './publicaciones.schema.js';
import { ComentariosController } from '../comentarios/comentarios.controller.js';
import { ComentariosService } from '../comentarios/comentarios.service.js';
import { Comentarios, ComentariosSchema } from '../comentarios/comentarios.schema.js';
import { Usuario, UsuarioSchema } from '../usuarios/usuario.schema.js';
import { ImagenesService } from '../auth/imagenes.service.js';
import { AdministradorGuard } from '../auth/administrador.guard.js';
import { EstadisticasController } from './estadisticas.controller.js';
import { EstadisticasService } from './estadisticas.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicaciones.name, schema: PublicacionesSchema },
      { name: Usuario.name, schema: UsuarioSchema },
      { name: Comentarios.name, schema: ComentariosSchema }
    ])
  ],
  controllers: [
    PublicacionesController,
    ComentariosController,
    EstadisticasController
  ],
  providers: [
    PublicacionesService,
    ComentariosService,
    ImagenesService,
    AdministradorGuard,
    EstadisticasService
  ],
})
export class PublicacionesModule {}