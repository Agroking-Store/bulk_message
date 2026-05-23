import { Controller, Post, Body, Get, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TemplateService } from './template.service';

@Controller('template')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post('create')
  async createTemplate(@Body() body: any) {

    console.log(" FRONTEND DATA:", JSON.stringify(body, null, 2));

    const payload = {
      name: body.name,
      category: body.category,
      language: body.language,
      components: body.components, 
    };

    console.log(" FINAL PAYLOAD:", JSON.stringify(payload, null, 2));

    return await this.templateService.createTemplate(payload);
  }

  @Post('upload-media')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file: Express.Multer.File, @Body('type') type: string) {
    if (!file) {
      return { success: false, message: 'No file provided' };
    }
    return await this.templateService.uploadMediaToMeta(file, type || 'IMAGE');
  }

  @Get('all')
  getTemplates() {
    return this.templateService.getTemplates();
  }

  @Post('delete')
  async deleteTemplate(@Body() body: { name: string }) {
    return await this.templateService.deleteTemplate(body.name);
  }

  @Post('update/:id')
  async updateTemplate(@Param('id') id: string, @Body() body: any) {
    console.log(" UPDATE FRONTEND DATA:", JSON.stringify(body, null, 2));

    const payload = {
      components: body.components,
    };

    return await this.templateService.updateTemplate(id, payload);
  }
}