import { Controller, Post, Body, Get, Query, Res, HttpStatus, Headers, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { Response, Request } from 'express';
import { WhatsAppService } from './whatsapp.service';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
    constructor(private readonly whatsappService: WhatsAppService) { }

    @Get('webhook')
    verifyWebhook(
        @Query('hub.mode') mode: string,
        @Query('hub.verify_token') token: string,
        @Query('hub.challenge') challenge: string,
        @Res() res: Response,
        @Headers('user-agent') userAgent: string,
    ) {
        const verifyToken = this.whatsappService.getVerifyToken();

        if (mode === 'subscribe' && token === verifyToken) {
            return res.status(HttpStatus.OK).send(challenge);
        } else {
            return res.status(HttpStatus.FORBIDDEN).end();
        }
    }

    @Post('webhook')
    handleWebhook(@Body() body: any) {
        // This is where you would handle incoming messages or status updates
        return { status: 'EVENT_RECEIVED' };
    }

    @Post('campaign')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async createCampaign(
        @Req() req: Request,
        @Body('group') group: string,
        @Body('campaignName') campaignName: string,
        @Body('message') message: string,
        @Body('contactIds') contactIds?: string[],
        @Body('media') media?: { url: string; type: string; originalName?: string }[],
        @Body('templateType') templateType?: string,
        @Body('templateName') templateName?: string,
        @Body('templateParams') templateParams?: any,
    ) {
        if (!group || !campaignName || !message) {
            throw new BadRequestException('group, campaignName, and message are required');
        }

        const userId = (req.user as any).userId;
        const result = await this.whatsappService.triggerCampaign(userId, group, campaignName, message, undefined, media, contactIds, templateType, templateName, templateParams);
        return { status: 'success', data: result };
    }

    @Post('schedule')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Schedule a new campaign' })
    async scheduleCampaign(
        @Req() req: Request,
        @Body('group') group: string,
        @Body('campaignName') campaignName: string,
        @Body('message') message: string,
        @Body('scheduledAt') scheduledAt: string,
        @Body('contactIds') contactIds?: string[],
        @Body('media') media?: { url: string; type: string; originalName?: string }[],
        @Body('templateType') templateType?: string,
        @Body('templateName') templateName?: string,
        @Body('templateParams') templateParams?: any,
    ) {
        if (!group || !campaignName || !message || !scheduledAt) {
            throw new BadRequestException('group, campaignName, message, and scheduledAt are required');
        }

        const userId = (req.user as any).userId;

        const date = new Date(scheduledAt);
        if (isNaN(date.getTime())) {
            throw new BadRequestException('Invalid date format');
        }
        const result = await this.whatsappService.scheduleCampaign(userId, group, campaignName, message, date, media, contactIds, templateType, templateName, templateParams);
        return { status: 'success', data: result };
    }

    @Get('campaigns')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async getCampaigns(
        @Req() req: Request,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const userId = (req.user as any).userId;
        const result = await this.whatsappService.getCampaigns(
            userId,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
        );
        return { status: 'success', data: result };
    }

    @Get('groups')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async getGroups(@Req() req: Request) {
        const userId = (req.user as any).userId;
        const groups = await this.whatsappService.getGroups(userId);
        return { status: 'success', data: groups };
    }

    @Get('templates')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all active Meta templates' })
    async getTemplates() {
        try {
            const templates = await this.whatsappService.getTemplatesFull();
            return { status: 'success', data: templates };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
}
