import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { Cron } from '@nestjs/schedule';
import { QueueService } from '../queue/queue.service';
import { BULK_QUEUE, SCHEDULER_QUEUE, BulkJobPayload, SchedulerJobPayload } from '../../queues/queue.processor';
import { Contact } from '../contacts/schemas/contact.schema';
import { Campaign } from '../whatsapp/schemas/campaign.schema';
import { StatusService } from '../message-status/status.service';
import { HistoryService } from '../message-history/history.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { SendBulkDto } from './dto/send-bulk.dto';
import { ScheduleMessageDto } from './dto/schedule-message.dto';
import { WalletService } from '../wallet/wallet.service';

const PRICING = {
    utility: 0.50,
    marketing: 0.82
};

@Injectable()
export class BulkService {
    private readonly logger = new Logger(BulkService.name);
    private readonly MESSAGE_DELAY_MS = 500;
    private readonly CHUNK_SIZE = 500;

    constructor(
        private readonly queueService: QueueService,
        @InjectModel(Contact.name) private readonly contactModel: Model<Contact>,
        @InjectModel(Campaign.name) private readonly campaignModel: Model<Campaign>,
        private readonly statusService: StatusService,
        private readonly historyService: HistoryService,
        private readonly notificationsService: NotificationsService,
        private readonly gateway: NotificationsGateway,
        private readonly walletService: WalletService,
    ) { }

    async sendBulk(userId: string, dto: SendBulkDto) {
        this.logger.log(`[sendBulk] Starting for user ${userId}, campaign: ${dto.campaignId}, group: ${dto.group}, contactIds: ${dto.contactIds?.length || 0}`);

        // Determine the most specific query, with fallbacks for robustness
        if (dto.group === "ALL" || dto.group === "All contacts") {
            dto.group = "All contacts";
        }

        let query: any = { phone: { $exists: true, $ne: '' } };

        if (dto.contactIds && dto.contactIds.length > 0) {
            // Try: contactIds + userId
            query = { _id: { $in: dto.contactIds }, userId, phone: { $exists: true, $ne: '' } };
            this.logger.debug(`[sendBulk] Querying by contactIds: ${dto.contactIds.length}`);

            const count = await this.contactModel.countDocuments(query);
            if (count === 0) {
                // Fallback: If _id search failed, try phone search (useful if frontend sends numeric IDs instead of ObjectIds)
                const contacts = await this.contactModel.find({ phone: { $in: dto.contactIds }, userId }).lean();
                if (contacts.length > 0) {
                    const realIds = contacts.map(c => c._id);
                    query = { _id: { $in: realIds }, userId };
                    this.logger.debug(`[sendBulk] Resolved ${realIds.length} contact ObjectIds from phone numbers`);
                } else {
                    this.logger.warn(`[sendBulk] No contacts found by _id or phone list`);
                }
            }
        } else if (dto.group && dto.group !== 'All contacts') {
            // No specific contacts chosen - target the whole group
            query = { userId, group: dto.group, phone: { $exists: true, $ne: '' } };
            this.logger.debug(`[sendBulk] Querying by group: ${dto.group}`);
        } else {
            // Last resort: all contacts of this user (handles 'All contacts' or empty group)
            query = { userId, phone: { $exists: true, $ne: '' } };
        }

        const total = await this.contactModel.countDocuments(query);
        this.logger.log(`[sendBulk] Found ${total} matching contacts. Query: ${JSON.stringify(query)}`);

        // CRITICAL: Update campaign's totalContacts AS EARLY AS POSSIBLE
        // so that workers processing jobs in parallel have the correct total count
        const campaignId = dto.campaignId || 'message-bulk';
        if (campaignId.length === 24) {
            await this.campaignModel.findByIdAndUpdate(campaignId, {
                totalContacts: total,
                status: total === 0 ? 'failed' : 'in-progress'
            });

            // Emit initial progress so UI can show the active campaign immediately
            this.gateway.emitCampaignProgress({
                userId,
                campaignId,
                sentCount: 0,
                failedCount: 0,
                totalContacts: total,
                status: total === 0 ? 'failed' : 'in-progress'
            });
        }

        if (!total) {
            const msg = `No valid contacts with phone numbers found${dto.group ? ' for group: ' + dto.group : ''}`;
            this.logger.warn(`[sendBulk] ${msg}`);
            if (campaignId === 'message-bulk') {
                throw new BadRequestException(msg);
            }
            return { campaignId, queued: 0 };
        }

        // WALLET BLOCKER LOGIC 
        const templateType = dto.templateType || 'utility';
        const costPerMsg = PRICING[templateType.toLowerCase()] || PRICING.utility;
        const totalCost = total * costPerMsg;

        // Check if this campaign was already pre-paid (e.g., from a scheduled reservation)
        let isPrePaid = false;
        if (campaignId && campaignId.length === 24) {
            const campaign = await this.campaignModel.findById(campaignId);
            if (campaign && (campaign.status === 'scheduled' || campaign.isScheduled)) {
                isPrePaid = true;
                this.logger.log(`[sendBulk] Campaign ${campaignId} is PRE-PAID (Scheduled). Skipping upfront debit.`);
            }
        }

        if (!isPrePaid) {
            const balanceBefore = await this.walletService.getBalance(userId);
            this.logger.log(`[WALLET CHECK] User: ${userId} | Balance Before: ₹${balanceBefore} | Required: ₹${totalCost} (Template: ${templateType})`);

            // This will throw BadRequestException if balance is insufficient
            const { balance: balanceAfter } = await this.walletService.debitWallet(userId, totalCost, `Bulk Campaign: ${campaignId}`, campaignId, 'whatsapp');
            this.logger.log(`[WALLET DEBIT SUCCESS] User: ${userId} | Deducted: ₹${totalCost} | Balance After: ₹${balanceAfter}`);
        }
        let jobIndex = 0;
        try {
            // Fetch and enqueue contacts in chunks of 500
            for (let skip = 0; skip < total; skip += this.CHUNK_SIZE) {
                const chunk = await this.contactModel
                    .find(query)
                    .skip(skip)
                    .limit(this.CHUNK_SIZE)
                    .lean()
                    .exec();

                for (const contact of chunk) {
                    const messageId = uuid();

                    await this.statusService.createPending({
                        messageId,
                        campaignId,
                        contactId: (contact._id as any).toString(),
                        phone: contact.phone,
                    });

                    const historyRecord = await this.historyService.create({
                        userId,
                        campaignId,
                        contactId: (contact._id as any).toString(),
                        phone: contact.phone,
                        message: dto.message,
                        status: 'pending',
                        sourceType: campaignId === 'message-bulk' ? 'message' : 'campaign'
                    });

                    const payload: BulkJobPayload = {
                        userId,
                        messageId,
                        campaignId,
                        historyId: (historyRecord._id as any).toString(),
                        contactId: (contact._id as any).toString(),
                        phone: contact.phone,
                        contactName: contact.name,
                        message: dto.message,
                        media: dto.media,
                        costPerMsg,
                        templateName: dto.templateName,
                        templateParams: dto.templateParams
                    };

                    await this.queueService.addBulkJob(
                        'send-message',
                        payload,
                        jobIndex * this.MESSAGE_DELAY_MS
                    );

                    jobIndex++;
                }
            }
        } catch (error) {
            this.logger.error(`[FATAL] Failed to enqueue campaign ${campaignId}. Triggering REFUND of ₹${totalCost}. Error: ${error.message}`);
            // Automatic Rollback / Refund
            await this.walletService.creditWallet(userId, totalCost, `REFUND: Failed Campaign ${campaignId}`, campaignId, 'whatsapp');
            throw error;
        }

        this.logger.log(`[${campaignId}] Successfully enqueued ${jobIndex} messages via BullMQ`);
        return { campaignId, queued: jobIndex };
    }
    async scheduleMessage(userId: string, dto: ScheduleMessageDto) {
        const scheduledAt = new Date(dto.scheduledAt);
        const now = Date.now();
        const delay = scheduledAt.getTime() - now;

        if (delay <= 0) {
            this.logger.error(`[scheduleMessage] Scheduled time is in the past: ${scheduledAt.toISOString()} (now: ${new Date(now).toISOString()})`);
            throw new BadRequestException('scheduledAt must be in the future');
        }

        if (dto.group === "ALL" || dto.group === "All contacts") {
            dto.group = "All contacts";
        }

        // WALLET BLOCKER LOGIC 
        // 1. Calculate count of contacts
        let total = dto.contactIds?.length || 0;
        if (dto.group && (!dto.contactIds || dto.contactIds.length === 0)) {
            const countQuery: any = { userId, phone: { $exists: true, $ne: '' } };
            if (dto.group !== "All contacts") {
                countQuery.group = dto.group;
            }
            total = await this.contactModel.countDocuments(countQuery);
        }

        if (total === 0) {
            throw new BadRequestException('No valid contacts found for scheduling');
        }

        // 2. Calculate cost
        const templateType = dto.templateType || 'utility';
        const costPerMsg = PRICING[templateType.toLowerCase()] || PRICING.utility;
        const totalCost = total * costPerMsg;

        // 3. Check and Debit
        await this.walletService.debitWallet(userId, totalCost, `Scheduled Message Reservation: ${dto.campaignId || 'manual'}`, dto.campaignId || 'scheduled', 'whatsapp');
        this.logger.log(`[scheduleMessage] Wallet Debit Success: ₹${totalCost} for ${total} contacts`);

        // Create a Campaign record so it shows up on the dashboard
        const campaign = new this.campaignModel({
            userId,
            campaignName: dto.campaignId || 'Scheduled Message',
            message: dto.message,
            group: dto.group,
            totalContacts: total,
            status: 'scheduled',
            isScheduled: true,
            scheduledTime: scheduledAt,
            contactIds: dto.contactIds || [],
            media: dto.media || [],
            sourceType: dto.sourceType || 'message', // Default to message when called from schedule-message endpoint
        });

        try {
            const savedCampaign = await campaign.save();
            const campaignId = savedCampaign._id.toString();

            const payload: SchedulerJobPayload = {
                userId,
                campaignId,
                message: dto.message,
                group: dto.group,
                contactIds: dto.contactIds,
                media: dto.media,
                templateName: dto.templateName,
                templateParams: dto.templateParams
            };

            this.logger.log(`[scheduleMessage] Campaign ${campaignId} successfully scheduled for ${scheduledAt.toISOString()} (delay: ${delay}ms)`);

            await this.queueService.addSchedulerJob(
                SCHEDULER_QUEUE,
                payload,
                delay
            );

            return { scheduled: true, campaignId, scheduledAt: scheduledAt.toISOString() };
        } catch (error) {
            this.logger.error(`[scheduleMessage] FATAL: Failed to schedule ${dto.campaignId}. Refunding ₹${totalCost}. Error: ${error.message}`);
            await this.walletService.creditWallet(userId, totalCost, `REFUND: Failed Schedule ${dto.campaignId || 'manual'}`, 'refund', 'whatsapp');
            throw error;
        }
    }

    @Cron('*/1 * * * *') // Run every minute
    async cleanupStalledCampaigns() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        this.logger.debug(`[cleanupStalledCampaigns] Checking for campaigns in-progress without activity since ${fiveMinutesAgo.toISOString()}`);

        const stalledCampaigns = await this.campaignModel.find({
            status: 'in-progress',
            updatedAt: { $lt: fiveMinutesAgo }
        }).exec();

        if (stalledCampaigns.length > 0) {
            this.logger.log(`[cleanupStalledCampaigns] Found ${stalledCampaigns.length} stalled campaigns.`);

            for (const campaign of stalledCampaigns) {
                const campaignId = (campaign._id as any).toString();
                this.logger.warn(`[cleanupStalledCampaigns] Auto-completing stalled campaign: ${campaignId} (${campaign.campaignName})`);

                await this.campaignModel.findByIdAndUpdate(campaignId, {
                    status: 'completed'
                });

                // Emit progress update so UI updates from 'in-progress' to 'completed'
                this.gateway.emitCampaignProgress({
                    userId: campaign.userId,
                    campaignId,
                    sentCount: campaign.sentCount,
                    failedCount: campaign.failedCount,
                    totalContacts: campaign.totalContacts,
                    status: 'completed'
                });

                // Notify the user about the stall cleanup
                await this.notificationsService.createNotification({
                    userId: campaign.userId,
                    title: 'Campaign Stalled & Auto-Completed',
                    message: `Campaign "${campaign.campaignName}" was stuck for > 5 mins. It has been marked as completed. Processed: ${campaign.sentCount + campaign.failedCount}/${campaign.totalContacts}`,
                    type: NotificationType.WARNING
                });

                // Delete temporary queue and start notifications for this stalled campaign
                try {
                    await this.notificationsService.deleteByMetadata(campaign.userId, 'campaignId', campaignId);

                    // Emit a special websocket event to tell the frontend to remove these notifications from the UI
                    this.gateway.server.to(`user:${campaign.userId}`).emit('remove-campaign-notifications', { campaignId });
                } catch (e) {
                    this.logger.error(`Failed to delete temporary notifications for stalled campaign ${campaignId}: ${e.message}`);
                }
            }
        }
    }
}

