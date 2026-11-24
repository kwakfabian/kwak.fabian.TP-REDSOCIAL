import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';
import { Usuario, UsuarioSchema } from './usuario.schema.js';
import { ImagenesService } from '../auth/imagenes.service.js';
import { AdministradorGuard } from '../auth/administrador.guard.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Usuario.name, schema: UsuarioSchema }
    ])
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService, ImagenesService, AdministradorGuard]
})
export class UsuariosModule {}