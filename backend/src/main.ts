import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { setServers } from 'node:dns';
import { AppModule } from './app.module.js';

async function bootstrap() {
  setServers(['8.8.8.8', '1.1.1.1']);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true,}),);
  app.enableCors();
  app.useStaticAssets(join(process.cwd(), 'uploads'), {prefix: '/uploads/',});
    await app.listen(process.env.PORT ?? 3100);
}

bootstrap();