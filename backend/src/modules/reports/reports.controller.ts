import { Controller, Get, Query, UseGuards, Req, Res, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @ApiOperation({ summary: 'Get summary statistics' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    @Get('stats')
    async getStats(@Req() req: Request, @Query('days') days?: string) {
        const userId = (req.user as any).userId;
        return this.reportsService.getStats(userId, days ? parseInt(days) : undefined);
    }

    @ApiOperation({ summary: 'Get messaging trends' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    @Get('trends')
    async getTrends(@Req() req: Request, @Query('days') days?: string) {
        const userId = (req.user as any).userId;
        return this.reportsService.getTrends(userId, days ? parseInt(days) : undefined);
    }

    @ApiOperation({ summary: 'Get email messaging trends' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    @Get('trends/email')
    async getEmailTrends(@Req() req: Request, @Query('days') days?: string) {
        const userId = (req.user as any).userId;
        return this.reportsService.getEmailTrends(userId, days ? parseInt(days) : undefined);
    }

    @ApiOperation({ summary: 'Get contact group distribution' })
    @Get('groups')
    async getGroupDistribution(@Req() req: Request) {
        const userId = (req.user as any).userId;
        return this.reportsService.getGroupDistribution(userId);
    }

    @ApiOperation({ summary: 'Get top performing campaigns' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    @Get('top-campaigns')
    async getTopCampaigns(@Req() req: Request, @Query('days') days?: string) {
        const userId = (req.user as any).userId;
        return this.reportsService.getTopCampaigns(userId, days ? parseInt(days) : undefined);
    }

    @ApiOperation({ summary: 'Download campaign report CSV' })
    @ApiParam({ name: 'id', required: true, description: 'Campaign ID' })
    @Get('download/:id')
    async downloadCampaignReport(
        @Req() req: Request,
        @Param('id') id: string,
        @Res() res: Response
    ) {
        try {
            const userId = (req.user as any).userId;
            const csv = await this.reportsService.generateCampaignReportCsv(userId, id);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=campaign_report_${id}.csv`);
            return res.status(HttpStatus.OK).send(csv);
        } catch (error) {
            return res.status(HttpStatus.NOT_FOUND).json({
                status: 'error',
                message: error.message
            });
        }
    }
}
