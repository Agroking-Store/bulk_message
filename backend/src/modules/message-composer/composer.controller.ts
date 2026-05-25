import { Controller, Get, Post, Body, UseGuards, Param, Req } from '@nestjs/common';
import { ComposerService } from './composer.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('composer')
export class ComposerController {
    constructor(private readonly composerService: ComposerService) { }

    @Post('template')
    async createTemplate(@Req() req: Request, @Body() body: { name: string; message: string; media?: any[] }) {
        const userId = (req.user as any).userId;
        return this.composerService.createTemplate(userId, body);
    }

    @Get('template/:id')
    async getTemplate(@Req() req: Request, @Param('id') id: string) {
        const userId = (req.user as any).userId;
        return this.composerService.getTemplate(userId, id);
    }

    @Get('templates')
    async getTemplates(@Req() req: Request) {
        const userId = (req.user as any).userId;
        return this.composerService.getTemplates(userId);
    }

    @Post('delete/:id')
    async deleteTemplate(@Req() req: Request, @Param('id') id: string) {
        const userId = (req.user as any).userId;
        return this.composerService.deleteTemplate(userId, id);
    }
}
