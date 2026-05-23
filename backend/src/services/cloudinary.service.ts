import { Injectable } from '@nestjs/common';
import { CloudinaryConfig } from '../config/cloudinary.config';

@Injectable()
export class CloudinaryService {
  constructor(private cloudinaryConfig: CloudinaryConfig) {}

  async uploadMedia(file: Express.Multer.File, folder: string = 'general'): Promise<{ url: string; publicId: string; resourceType: string }> {
    return new Promise((resolve, reject) => {
      const cloudinary = this.cloudinaryConfig.getCloudinary();
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto', // Detects if it's an image, video, or raw file (docs)
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: result.resource_type
            });
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'general'): Promise<{ url: string; publicId: string }> {
    const result = await this.uploadMedia(file, folder);
    return { url: result.url, publicId: result.publicId };
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const cloudinary = this.cloudinaryConfig.getCloudinary();
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      throw error;
    }
  }

  async uploadBuffer(buffer: Buffer, folder: string = 'general', filename?: string): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const cloudinary = this.cloudinaryConfig.getCloudinary();
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          public_id: filename ? filename.split('.')[0] : undefined,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  }
}
