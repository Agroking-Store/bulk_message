import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';

import { TemplateService } from './template.service';

@Controller('templates')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
  ) {}

  

  @Get()
  async getTemplates(
    @Query('status') status?: string,
  ) {
    return this.templateService.getAllTemplates(
      status,
    );
  }

  

  @Get('counts')
  async getCounts() {
    return this.templateService.getCounts();
  }

  

  @Post('sync')
  async syncTemplates() {
    return this.templateService.syncTemplates();
  }

  

  @Get(':id')
  async getTemplate(
    @Param('id') id: string,
  ) {
    return this.templateService.getTemplateById(
      id,
    );
  }

  

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.templateService.updateTemplateStatus(
      id,
      body.status,
    );
  }

  

  @Delete(':id')
  async deleteTemplate(
    @Param('id') id: string,
  ) {
    return this.templateService.deleteTemplate(
      id,
    );
  }
}