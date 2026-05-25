import { Controller, Post, Get, Body, Query, UsePipes, ValidationPipe, UseGuards, Req, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { BulkService } from './bulk.service';
import { SendBulkDto } from './dto/send-bulk.dto';
import { ScheduleMessageDto } from './dto/schedule-message.dto';
import { SCHEDULER_QUEUE, BULK_QUEUE, BulkJobPayload } from '../../queues/queue.processor';
import { HistoryService } from '../message-history/history.service';
import { StatusService } from '../message-status/status.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { v4 as uuid } from 'uuid';
import { QueueService } from '../queue/queue.service';
import { Campaign } from '../whatsapp/schemas/campaign.schema';
import { WalletService } from '../wallet/wallet.service';

@ApiTags('bulk-messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
@UsePipes(new ValidationPipe({ whitelist: true }))
export class BulkController {
    private readonly logger = new Logger(BulkController.name);
    constructor(
        private readonly bulkService: BulkService,
        private readonly historyService: HistoryService,
        private readonly statusService: StatusService,
        private readonly queueService: QueueService,
        private readonly walletService: WalletService,
        @InjectModel(Campaign.name) private readonly campaignModel: Model<Campaign>,
    ) { }

    @ApiOperation({ summary: 'Send bulk messages' })
    @Post('bulk/send')
    async sendBulk(@Req() req: Request, @Body() dto: SendBulkDto) {
        const userId = (req.user as any).userId;
        return await this.bulkService.sendBulk(userId, dto);
    }

    @ApiOperation({ summary: 'Schedule a bulk campaign' })
    @Post('schedule-message')
    async scheduleMessage(@Req() req: Request, @Body() dto: ScheduleMessageDto) {
        const userId = (req.user as any).userId;
        return await this.bulkService.scheduleMessage(userId, dto);
    }

    @ApiOperation({ summary: 'Send a single message' })
    @Post('send-message')
    async sendMessage(@Req() req: Request, @Body() body: { phone: string; message: string }) {
        const userId = (req.user as any).userId;
        const messageId = uuid();
        const campaignId = 'message'; // Special identifier for individual messages

        // Create pending status
        await this.statusService.createPending({
            messageId,
            campaignId,
            contactId: null,
            phone: body.phone,
        });

        // Create history record with 'message' sourceType
        const historyRecord = await this.historyService.create({
            userId,
            campaignId,
            contactId: null,
            phone: body.phone,
            message: body.message,
            status: 'pending',
            sourceType: 'message'
        });

        // WALLET BLOCKER LOGIC (Single Message)
        const costPerMsg = 0.50; // Default utility cost for single messages
        await this.walletService.debitWallet(userId, costPerMsg, `Single Message: ${body.phone}`, 'message', 'whatsapp');

        // Schedule immediate sending
        const payload: BulkJobPayload = {
            userId,
            messageId,
            campaignId,
            historyId: (historyRecord._id as any).toString(),
            contactId: null,
            phone: body.phone,
            contactName: body.phone, 
            message: body.message,
            costPerMsg,
        };
        
        try {
            await this.queueService.addBulkJob('send-message', payload);
            return { messageId, status: 'queued' };
        } catch (error) {
            this.logger.error(`[sendMessage] FATAL: Failed to enqueue message for ${body.phone}. Refunding ₹${costPerMsg}. Error: ${error.message}`);
            await this.walletService.creditWallet(userId, costPerMsg, `REFUND: Failed Single Message to ${body.phone}`, 'refund', 'whatsapp');
            throw error;
        }
    }

    @Get('scheduled-messages')
    async getScheduledMessages(
        @Req() req: Request,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const userId = (req.user as any).userId;
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const skip = (pageNum - 1) * limitNum;

        const filter = {
            userId,
            isScheduled: true,
            sourceType: 'message',
            status: { $in: ['scheduled', 'completed', 'in-progress', 'failed'] }
        };

        // Fetch from Campaign model for persistence
        const [campaigns, total] = await Promise.all([
            this.campaignModel.find(filter)
                .sort({ scheduledTime: -1, createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean()
                .exec(),
            this.campaignModel.countDocuments(filter)
        ]);

        return {
            total,
            page: pageNum,
            limit: limitNum,
            data: campaigns.map((c: any) => ({
                _id: c._id,
                campaignId: c.campaignName,
                group: c.group,
                message: c.message,
                scheduledAt: c.scheduledTime || c.createdAt,
                status: c.status,
                sentCount: c.sentCount || 0,
                failedCount: c.failedCount || 0,
                totalContacts: c.totalContacts || 0,
            }))
        };
    }
}
