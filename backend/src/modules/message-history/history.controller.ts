import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('history')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) { }

    @ApiOperation({ summary: 'Get all message/campaign history' })
    @Get()
    getHistory(
        @Req() req: Request,
        @Query('campaignId') campaignId?: string,
        @Query('sourceType') sourceType?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const userId = (req.user as any).userId;
        return this.historyService.findAll(
            userId,
            campaignId,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
            sourceType,
        );
    }

    @ApiOperation({ summary: 'Get direct message history' })
    @Get('message-history')
    getMessageHistory(
        @Req() req: Request,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const userId = (req.user as any).userId;
        return this.historyService.findAll(
            userId,
            undefined,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
            'message',
        );
    }

    @ApiOperation({ summary: 'Get campaign history' })
    @Get('campaign-history')
    getCampaignHistory(
        @Req() req: Request,
        @Query('campaignId') campaignId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const userId = (req.user as any).userId;
        return this.historyService.findAll(
            userId,
            campaignId,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
            'campaign',
        );
    }
}
