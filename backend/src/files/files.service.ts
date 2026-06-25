import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { BusinessError } from '../common/errors/business-error';

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class FilesService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    cloudinary.config({
      cloud_name: this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    companyId: string,
    subfolder = 'website',
  ): Promise<UploadedImage> {
    if (!file) {
      throw new BusinessError(422, 'Archivo requerido', 'BUSINESS_RULE_VIOLATION');
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BusinessError(
        422,
        'Formato de imagen no permitido (jpg, png, webp, gif)',
        'BUSINESS_RULE_VIOLATION',
        'file',
      );
    }
    if (file.size > MAX_BYTES) {
      throw new BusinessError(
        422,
        'La imagen supera el tamaño máximo de 5 MB',
        'BUSINESS_RULE_VIOLATION',
        'file',
      );
    }

    // Carpeta scoped por empresa — requisito de seguridad.
    const folder = `salesflow/${companyId}/${subfolder}`;
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, response) => {
          if (error || !response) return reject(error ?? new Error('upload_failed'));
          resolve(response);
        },
      );
      stream.end(file.buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  }
}
