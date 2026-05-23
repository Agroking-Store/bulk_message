import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('stats')
    async getDashboardAnalytics(@Req() req: Request, @Query('range') range?: string) {
        const userId = (req.user as any)?.userId;
        return this.dashboardService.getAnalytics(userId, range);
    }
}
