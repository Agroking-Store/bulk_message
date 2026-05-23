import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { EmailCampaign } from '../schemas/email-campaign.schema';
import { EmailTemplate, EmailTemplateDocument } from '../schemas/email-template.schema';
import { WalletService } from '../../wallet/wallet.service';
import { SendGridService } from './sendgrid.service';
import { QueueService } from '../../queue/queue.service';
import { SchedulerJobPayload } from '../../../queues/queue.processor';
import { ContactsService } from '../../contacts/contacts.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';

@Injectable()
export class UserEmailService {
    private readonly logger = new Logger(UserEmailService.name);

    constructor(
        private readonly configService: ConfigService,
        @InjectModel(EmailCampaign.name) private emailCampaignModel: Model<EmailCampaign>,
        @InjectModel(EmailTemplate.name) private emailTemplateModel: Model<EmailTemplateDocument>,
        private readonly walletService: WalletService,
        private readonly sendGridService: SendGridService,
        private readonly queueService: QueueService,
        private readonly contactsService: ContactsService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async triggerCampaign(userId: string, data: {
        name?: string;
        campaignName?: string;
        subject: string;
        body: string;
        recipients: string[];
        group?: string;
        media?: { url: string; originalName?: string }[]
    }) {
        // 1. Deduplicate recipients
        const uniqueRecipients = [...new Set(data.recipients)];
        const totalRecipients = uniqueRecipients.length;
        const totalCost = totalRecipients * 0.10;

        try {
            console.log(`[UserEmailService] Triggering campaign: ${data.campaignName || data.subject}. Recipients: ${totalRecipients} - user-email.service.ts:43`);

            // 2. Debit wallet first
            const campaignLabel = data.campaignName || data.name || data.subject;
            this.logger.log(`[UserEmailService] Debiting wallet for campaign: ${campaignLabel}. Cost: ₹${totalCost}`);
            await this.walletService.debitWallet(userId, totalCost, `Email Campaign: ${campaignLabel}`, undefined, 'email');
            this.logger.log(`[UserEmailService] Wallet debited successfully for campaign: ${campaignLabel}`);

            // 3. Create campaign in DB
            const campaign = await this.emailCampaignModel.create({
                userId,
                campaignName: data.campaignName || data.name || campaignLabel,
                subject: data.subject,
                body: data.body,
                group: data.group,
                totalRecipients,
                totalContacts: totalRecipients,
                media: data.media,
                status: 'in-progress',
                sentCount: 0,
                openedCount: 0,
                spamCount: 0,
                bouncedCount: 0
            });

            // Emit initial progress notification to show the animated progress bar in the UI Notification Dropdown
            await this.notificationsService.createNotification({
                userId,
                title: 'Email Campaign Started',
                message: `Initializing campaign ${campaign.campaignName}...`,
                type: NotificationType.PROGRESS,
                metadata: { campaignId: campaign._id.toString() }
            });

            // 4. Enqueue jobs (one per recipient)
            for (const recipient of uniqueRecipients) {
                await this.queueService.addEmailBulkJob('EMAIL_SEND_JOB', {
                    userId,
                    campaignId: campaign._id.toString(),
                    recipient,
                    subject: data.subject,
                    body: data.body,
                    media: data.media
                });
            }

            return { success: true, status: 'triggered', campaignId: campaign._id, totalRecipients };
        } catch (error: any) {
            console.error(`[UserEmailService] Failed to schedule campaign: ${error.message} - user-email.service.ts:80`);
            throw error;
        }
    }

    async scheduleCampaign(userId: string, data: {
        campaignName?: string;
        subject: string;
        body: string;
        scheduledAt: Date;
        recipients?: string[];
        group?: string;
        contactIds?: string[];
        media?: { url: string; originalName?: string }[],
        sourceType?: string
    }) {
        // 1. Resolve recipients count for wallet debit
        let finalRecipients: string[] = data.recipients || [];
        if (finalRecipients.length === 0) {
            const query: any = { userId };
            if (data.group && data.group !== 'All contacts') {
                query.group = data.group;
            }
            if (data.contactIds && data.contactIds.length > 0) {
                query._id = { $in: data.contactIds };
            }
            const contacts = await this.contactsService.getContacts(userId, 1, 100000, data.group);
            finalRecipients = contacts.records.map(c => c.email).filter(e => !!e);
        }

        const uniqueRecipients = [...new Set(finalRecipients)];
        const totalRecipients = uniqueRecipients.length;
        const totalCost = totalRecipients * 0.10;

        try {
            const campaignLabel = data.campaignName || data.subject;

            // 2. Debit wallet first
            await this.walletService.debitWallet(userId, totalCost, `Scheduled Email: ${campaignLabel}`, undefined, 'email');

            // 3. Create scheduled campaign in DB
            const campaign = await this.emailCampaignModel.create({
                userId,
                campaignName: campaignLabel,
                subject: data.subject,
                body: data.body,
                group: data.group,
                contactIds: data.contactIds,
                totalRecipients,
                totalContacts: totalRecipients,
                media: data.media,
                status: 'scheduled',
                isScheduled: true,
                scheduledTime: data.scheduledAt,
                sentCount: 0,
                openedCount: 0,
                spamCount: 0,
                bouncedCount: 0,
                sourceType: data.sourceType || 'campaign'
            });

            // 4. Add to scheduler queue
            const now = new Date();
            const delay = Math.max(0, new Date(data.scheduledAt).getTime() - now.getTime());

            const payload: SchedulerJobPayload = {
                userId,
                campaignId: campaign._id.toString(),
                message: data.body,
                type: 'email',
                subject: data.subject,
                group: data.group,
                contactIds: data.contactIds,
                media: data.media as any,
            };

            await this.queueService.addSchedulerJob('process-bulk-campaign', payload, delay);

            return { success: true, status: 'scheduled', campaignId: campaign._id, scheduledAt: data.scheduledAt };
        } catch (error: any) {
            console.error(`[UserEmailService] Failed to schedule campaign: ${error.message} - user-email.service.ts:160`);
            throw error;
        }
    }

    async triggerScheduledCampaign(userId: string, campaignId: string) {
        const campaign = await this.emailCampaignModel.findById(campaignId);
        if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

        // Resolve latest contacts
        const query: any = { userId };
        if (campaign.group && campaign.group !== 'All contacts') {
            query.group = campaign.group;
        }
        if (campaign.contactIds && campaign.contactIds.length > 0) {
            query._id = { $in: campaign.contactIds };
        }

        const contacts = await this.contactsService.getContacts(userId, 1, 100000, campaign.group);
        const uniqueEmails = [...new Set(contacts.records.map(c => c.email).filter(e => !!e))];

        campaign.status = 'in-progress';
        campaign.totalRecipients = uniqueEmails.length;
        campaign.totalContacts = uniqueEmails.length;
        await campaign.save();

        // Emit initial progress notification for scheduled campaign execution
        await this.notificationsService.createNotification({
            userId,
            title: 'Scheduled Email Started',
            message: `Initializing ${campaign.campaignName}...`,
            type: NotificationType.PROGRESS,
            metadata: { campaignId: campaign._id.toString() }
        });

        for (const recipient of uniqueEmails) {
            await this.queueService.addEmailBulkJob('EMAIL_SEND_JOB', {
                userId,
                campaignId: campaign._id.toString(),
                recipient,
                subject: campaign.subject,
                body: campaign.body,
                media: campaign.media
            });
        }

        return { success: true, status: 'triggered', campaignId: campaign._id };
    }

    // Keep sendEmail for backward compatibility or single sends if needed
    async sendEmail(userId: string, data: any) {
        return this.triggerCampaign(userId, data);
    }

    async getCampaignHistory(userId: string) {
        return this.emailCampaignModel.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    }

    // Alias used by controller @Get('history')
    async getHistory(userId: string) {
        return this.getCampaignHistory(userId);
    }

    async getStats(userId: string) {
        const campaigns = await this.emailCampaignModel.find({ userId }).exec();
        const totalSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
        const opened = campaigns.reduce((sum, c) => sum + (c.openedCount || 0), 0);
        const spam = campaigns.reduce((sum, c) => sum + (c.spamCount || 0), 0);
        const bounced = campaigns.reduce((sum, c) => sum + (c.bouncedCount || 0), 0);

        return {
            totalSent,
            opened,
            spam,
            bounced
        };
    }

    // Alias used by controller @Get('analytics/latest')
    async getLatestStats(userId: string) {
        const campaign = await this.emailCampaignModel.findOne({ userId }).sort({ createdAt: -1 }).exec();
        if (!campaign) return null;

        // Process activity into timeSeriesData for the chart
        // We'll group by hour for the last 24 hours
        const activity = campaign.activity || [];
        const timeSeriesMap = new Map<string, { time: string, opens: number, clicks: number }>();

        // We MUST initialize the last 6 hours so Recharts always has at least 2 points to draw a line.
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 3600000);
            const ts = `${d.getHours()}:00`;
            timeSeriesMap.set(ts, { time: ts, opens: 0, clicks: 0 });
            // Add current hour explicitly in case it rounded down differently
        }
        const currentTs = `${now.getHours()}:00`;
        if (!timeSeriesMap.has(currentTs)) {
             timeSeriesMap.set(currentTs, { time: currentTs, opens: 0, clicks: 0 });
        }

        // For a more dynamic feel, let's just use the actual event times grouped by hour
        activity.forEach(act => {
            const date = new Date(act.timestamp);
            const timeStr = `${date.getHours()}:00`;
            
            if (!timeSeriesMap.has(timeStr)) {
                timeSeriesMap.set(timeStr, { time: timeStr, opens: 0, clicks: 0 });
            }
            
            const stats = timeSeriesMap.get(timeStr);
            if (act.action === 'open') stats.opens++;
            if (act.action === 'click') stats.clicks++;
        });

        const timeSeriesData = Array.from(timeSeriesMap.values()).sort((a, b) => {
            // Sort by actual time value parsing hour
            const aHour = parseInt(a.time.split(':')[0]);
            const bHour = parseInt(b.time.split(':')[0]);
            
            // Handle edge case of midnight crossing by using relative diff to now
            const currentHour = now.getHours();
            
            const aRelative = aHour > currentHour ? aHour - 24 : aHour;
            const bRelative = bHour > currentHour ? bHour - 24 : bHour;
            
            return aRelative - bRelative;
        });

        return {
            ...campaign.toObject(),
            opened: campaign.openedCount || 0,
            spam: campaign.spamCount || 0,
            bounced: campaign.bouncedCount || 0,
            sentCount: campaign.sentCount || 0,
            failedCount: campaign.bouncedCount || 0,
            timeSeriesData
        };
    }

    // --- Template Management ---

    async createTemplate(userId: string, data: any) {
        return this.emailTemplateModel.create({
            ...data,
            userId,
            history: [{ action: 'CREATED', changedAt: new Date() }]
        });
    }

    async getTemplates(userId: string) {
        const templates = await this.emailTemplateModel.find({ userId }).sort({ createdAt: -1 }).exec();

        // Flatten templates into history records for the frontend table
        const history = [];
        for (const t of templates) {
            for (const h of t.history) {
                history.push({
                    id: `${t._id}_${h.changedAt.getTime()}`,
                    templateName: t.name,
                    action: h.action,
                    changedAt: h.changedAt,
                    // Include original template data for viewing
                    _id: t._id,
                    name: t.name,
                    subject: t.subject,
                    body: t.body,
                    footer: t.footer,
                    attachments: t.attachments
                });
            }
        }

        // Sort by most recent change
        return history.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
    }

    async getRawTemplates(userId: string) {
        return this.emailTemplateModel.find({ userId }).sort({ createdAt: -1 }).lean().exec();
    }
}