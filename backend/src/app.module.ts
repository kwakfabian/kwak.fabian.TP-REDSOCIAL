import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PublicacionesModule } from './publicaciones/publicaciones.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

if (existsSync('.env')) loadEnvFile('.env');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {throw new Error('Configura MONGODB_URI en .env con la conexion de MongoDB Atlas',);
}

  @Module({
    imports: [
      MongooseModule.forRoot(mongoUri),
      PublicacionesModule,
      AuthModule,
      UsuariosModule,
    ],
    controllers: [AppController],
    providers: [AppService],
  })
  export class AppModule {}