import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../../services/cloudinary.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload media for WhatsApp messages' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      this.logger.log(`Uploading file: ${file.originalname} (${file.mimetype})`);
      const result = await this.cloudinaryService.uploadMedia(file, 'whatsapp_media');
      
      // Map Cloudinary resource_type to WhatsApp-friendly media type
      // WhatsApp supported types: image, document, audio, video
      let mediaType = 'document';
      if (result.resourceType === 'image') mediaType = 'image';
      else if (result.resourceType === 'video') mediaType = 'video';
      else if (file.mimetype.startsWith('audio/')) mediaType = 'audio';

      return {
        status: 'success',
        data: {
          url: result.url,
          mediaType: mediaType,
          originalName: file.originalname,
          mimeType: file.mimetype
        },
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new BadRequestException(`Failed to upload media: ${error.message}`);
    }
  }
}
