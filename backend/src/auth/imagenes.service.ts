import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

@Injectable()
export class ImagenesService {

  private opciones() {
    const {
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET,
    } = process.env;

    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      throw new ServiceUnavailableException(
        'Falta configurar Cloudinary',
      );
    }

    return {
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    };
  }

  async subirPerfil(
    archivo: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {

    if (!archivo.buffer?.length || archivo.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Imagen inválida o demasiado grande');
    }

    let buffer: Buffer;

    try {
      buffer = await sharp(archivo.buffer, {
        limitInputPixels: 20_000_000,
        failOn: 'warning',
      })
        .rotate()
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new BadRequestException('La imagen no es válida');
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          ...this.opciones(),
          resource_type: 'image',
          public_id: `kwaksocial/perfiles/${randomUUID()}`,
          overwrite: false,
        },
        (error, resultado) => {
          if (error || !resultado) {
            return reject(
              new BadGatewayException('No se pudo subir la imagen'),
            );
          }

          resolve({
            url: resultado.secure_url,
            publicId: resultado.public_id,
          });
        },
      );

      stream.on('error', () =>
        reject(new BadGatewayException('No se pudo subir la imagen')),
      );

      stream.end(buffer);
    });
  }

  async eliminar(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        ...this.opciones(),
        resource_type: 'image',
      });
    } catch {
    }
  }
}