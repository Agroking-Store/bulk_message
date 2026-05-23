import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Campaign } from './schemas/campaign.schema';
import { Contact } from '../contacts/schemas/contact.schema';
import { QueueService } from '../queue/queue.service';
import { HistoryService } from '../message-history/history.service';
import { BULK_QUEUE, BulkJobPayload, SchedulerJobPayload } from '../../queues/queue.processor';

import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { WalletService } from '../wallet/wallet.service';

const PRICING = {
    utility: 0.50,
    marketing: 0.82
};

@Injectable()
export class WhatsAppService implements OnModuleInit {
    private readonly logger = new Logger(WhatsAppService.name);
    private readonly apiUrl: string;
    private readonly token: string;
    private readonly phoneId: string;
    private readonly businessId: string;
    private readonly JOB_NAME = 'WHATSAPP_CLOUD_CAMPAIGN';
    private readonly MESSAGE_DELAY_MS = 500;
    private templateCache: Map<string, string> = new Map(); // name -> language
    private lastTemplateFetch: number = 0;
    private readonly CACHE_TTL_MS = 300000; // 5 minutes

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly queueService: QueueService,
        private readonly historyService: HistoryService,
        private readonly notificationsService: NotificationsService,
        // private readonly statusService: StatusService, // Temporarily commented out
        @InjectModel(Campaign.name) private campaignModel: Model<Campaign>,
        @InjectModel(Contact.name) private contactModel: Model<Contact>,
        private readonly walletService: WalletService,
    ) {
        this.apiUrl = this.configService.get<string>('WHATSAPP_API_URL');
        this.token = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
        this.phoneId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
        this.businessId = this.configService.get<string>('WHATSAPP_BUSINESS_ACCOUNT_ID');
    }

    onModuleInit() {
        // Handled by Worker separately if needed, but in reality, 
        // WhatsAppService should probably not define workers.
        // Workers are usually dedicated classes with @Processor decorator.
    }

    async sendMessage(phone: string, message: string, mediaUrl?: string, mediaType: string = 'text', templateNameArg?: string, templateParamsArg?: any): Promise<string | null> {
        try {
            // Ensure phone is just digits (Meta expects CC + Number)
            let cleanPhone = phone.replace(/\D/g, '');

            // Auto-fix for common 10-digit Indian numbers
            if (cleanPhone.length === 10) {
                cleanPhone = '91' + cleanPhone;
            }
            const url = `${this.apiUrl}/${this.phoneId}/messages`;

            let payload: any = {
                messaging_product: 'whatsapp',
                to: cleanPhone,
            };

            const normalizedMsg = message.trim().toLowerCase();

            // Fetch and cache templates from Meta if needed
            const templatesMap = await this.getTemplatesMap();

            const isExplicitTemplate = message.startsWith('template:');
            let templateName = null;
            let templateLang = 'en';

            if (templateNameArg) {
                templateName = templateNameArg;
                templateLang = templatesMap.get(templateName.toLowerCase()) || 'en';
            } else if (isExplicitTemplate) {
                templateName = message.split(':')[1].trim();
                templateLang = templatesMap.get(templateName.toLowerCase()) || 'en';
            } else if (templatesMap.has(normalizedMsg)) {
                templateName = normalizedMsg;
                templateLang = templatesMap.get(normalizedMsg);
            }

            if (templateName) {
                payload.type = 'template';
                payload.template = {
                    name: templateName,
                    language: { code: templateLang },
                };

                const components: any[] = [];
                if (mediaUrl && mediaType !== 'text') {
                    // Header component for media
                    components.push({
                        type: 'header',
                        parameters: [
                            {
                                type: mediaType,
                                [mediaType]: {
                                    link: mediaUrl
                                }
                            }
                        ]
                    });
                }

                if (templateParamsArg) {
                    if (templateParamsArg.body && templateParamsArg.body.length > 0) {
                        components.push({
                            type: 'body',
                            parameters: templateParamsArg.body.map((val: string) => ({
                                type: 'text',
                                text: val || ' '
                            }))
                        });
                    }
                    if (templateParamsArg.buttons && templateParamsArg.buttons.length > 0) {
                        templateParamsArg.buttons.forEach((btn: any) => {
                            components.push({
                                type: 'button',
                                sub_type: 'url',
                                index: btn.index.toString(),
                                parameters: [
                                    {
                                        type: 'text',
                                        text: btn.url_suffix || ' '
                                    }
                                ]
                            });
                        });
                    }
                }

                if (components.length > 0) {
                    payload.template.components = components;
                }
            } else if (mediaUrl && mediaType !== 'text') {
                payload.type = mediaType;
                payload[mediaType] = {
                    link: mediaUrl,
                    caption: message,
                };
            } else {
                payload.recipient_type = 'individual',
                    payload.type = 'text';
                payload.text = {
                    preview_url: false,
                    body: message,
                };
            }

            const headers = {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            };

            this.logger.debug(`Sending to Meta API: ${JSON.stringify(payload)}`);

            const response = await firstValueFrom(this.httpService.post(url, payload, { headers }));

            this.logger.log(`Meta API Response for ${cleanPhone}: ${JSON.stringify(response.data)}`);

            const messageId = response.data?.messages?.[0]?.id;
            if (messageId) {
                this.logger.log(`SUCCESS: Message sent to ${cleanPhone}. ID: ${messageId}`);
                return messageId;
            }

            this.logger.warn(`WARNING: Meta API returned success but no message ID for ${cleanPhone}. Full Response: ${JSON.stringify(response.data)}`);
            return null;
        } catch (error : any) {
            const apiError = error.response?.data?.error;
            const errorMsg = apiError?.message || error.message;

            this.logger.error(
                `FAILED to send to ${phone} | ` +
                `Code: ${apiError?.code || 'N/A'} | ` +
                `Subcode: ${apiError?.error_subcode || 'N/A'} | ` +
                `Details: ${errorMsg}`
            );
            return null;
        }
    }

    async sendBulkMessages(contacts: Contact[], message: string, campaignId: string) {
        const campaign = await this.campaignModel.findById(campaignId);
        if (!campaign) {
            this.logger.error(`Campaign ${campaignId} not found`);
            return;
        }

        campaign.status = 'in-progress';
        await campaign.save();

        let sentCount = 0;
        let failedCount = 0;

        for (const contact of contacts) {
            const isSent = await this.sendMessage(contact.phone, message);

            // Record in history
            await this.historyService.create({
                userId: campaign.userId,
                campaignId,
                contactId: contact._id.toString(),
                phone: contact.phone,
                message,
                status: isSent ? 'sent' : 'failed',
                sourceType: campaignId.length === 24 ? 'campaign' : 'message'
            });

            if (isSent) {
                sentCount++;
            } else {
                failedCount++;
            }

            // Update intermediate counts for long-running campaigns
            if ((sentCount + failedCount) % 10 === 0) {
                await this.campaignModel.findByIdAndUpdate(campaignId, { sentCount, failedCount });
            }

            // Add a delay of 1 second between messages to avoid rate limits
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        campaign.sentCount = sentCount;
        campaign.failedCount = failedCount;
        campaign.status = 'completed';
        await campaign.save();

        this.logger.log(`Campaign ${campaignId} completed. Sent: ${sentCount}, Failed: ${failedCount}`);
    }

    async triggerCampaign(userId: string, group: string, campaignName: string, message: string, existingCampaignId?: string, media?: { url: string; type: string; originalName?: string }[], contactIds?: string[], templateType: string = 'utility', templateName?: string, templateParams?: any) {
        const query: any = { userId };
        if (group && group !== 'All contacts') {
            query.group = group;
        }
        if (contactIds && contactIds.length > 0) {
            query._id = { $in: contactIds };
        }
        const contacts = await this.contactModel.find(query).exec();

        if (contacts.length === 0) {
            throw new Error(`No contacts found for group: ${group}`);
        }

        // WALLET BLOCKER LOGIC
        const total = contacts.length;
        const costPerMsg = PRICING[templateType.toLowerCase()] || PRICING.utility;
        const totalCost = total * costPerMsg;

        // Check and Debit
        await this.walletService.debitWallet(userId, totalCost, `WhatsApp Campaign: ${campaignName}`, 'campaign', 'whatsapp');
        this.logger.log(`[triggerCampaign] Wallet Debit Success: ₹${totalCost} for ${total} contacts`);

        try {
            let campaign;
            if (existingCampaignId) {
                campaign = await this.campaignModel.findById(existingCampaignId);
                if (campaign) {
                    campaign.status = 'pending';
                    campaign.media = media || [];
                    campaign.contactIds = contactIds || [];
                }
            }

            if (!campaign) {
                campaign = new this.campaignModel({
                    userId,
                    campaignName,
                    message,
                    group,
                    totalContacts: contacts.length,
                    status: 'pending',
                    media: media || [],
                    contactIds: contactIds || [],
                    templateName,
                    templateParams,
                });
            } else {
                campaign.templateName = templateName;
                campaign.templateParams = templateParams;
            }
            const savedCampaign = await campaign.save();
            const campaignId = savedCampaign._id.toString();

            let jobIndex = 0;

            // Schedule all messages via BullMQ so the worker processes them.
            for (const contact of contacts) {
                const messageId = uuid();

                const historyRecord = await this.historyService.create({
                    userId,
                    campaignId,
                    contactId: (contact._id as any).toString(),
                    phone: contact.phone,
                    message,
                    status: 'pending',
                    sourceType: 'campaign'
                });

                const payload: BulkJobPayload = {
                    userId,
                    messageId,
                    campaignId,
                    historyId: (historyRecord._id as any).toString(),
                    contactId: (contact._id as any).toString(),
                    phone: contact.phone,
                    contactName: contact.name,
                    message,
                    media: media || [],
                    costPerMsg,
                    templateName,
                    templateParams,
                };

                await this.queueService.addBulkJob(
                    'send-message',
                    payload,
                    jobIndex * this.MESSAGE_DELAY_MS
                );

                jobIndex++;
            }

            // Update campaign status to in-progress immediately
            savedCampaign.status = 'in-progress';
            await savedCampaign.save();

            this.logger.log(`[${campaignId}] Queued ${jobIndex} messages via BullMQ for campaign ${campaignName}`);

            await this.notificationsService.createNotification({
                userId,
                title: 'Campaign Started',
                message: 'Campaign sending started',
                type: NotificationType.INFO,
                metadata: { campaignId }
            });

            await this.notificationsService.createNotification({
                userId,
                title: 'Queue Updates',
                message: `${jobIndex} messages added to queue`,
                type: NotificationType.INFO,
                metadata: { campaignId }
            });

            return {
                message: 'Campaign triggered successfully',
                campaignId: savedCampaign._id,
                totalContacts: contacts.length,
            };
        } catch (error : any) {
            this.logger.error(`[triggerCampaign] ERROR: ${error.message}. Triggering refund for user ${userId}`);
            await this.walletService.creditWallet(userId, totalCost, `REFUND: Failed for Campaign ${campaignName}`, 'campaign_refund', 'whatsapp');
            throw error;
        }
    }

    async scheduleCampaign(userId: string, group: string, campaignName: string, message: string, scheduledAt: Date, media?: { url: string; type: string; originalName?: string }[], contactIds?: string[], templateType: string = 'utility', templateName?: string, templateParams?: any) {
        const query: any = { userId };
        if (group && group !== 'All contacts') {
            query.group = group;
        }
        if (contactIds && contactIds.length > 0) {
            query._id = { $in: contactIds };
        }
        const contacts = await this.contactModel.find(query).exec();
        if (contacts.length === 0) {
            throw new Error(`No contacts found for group: ${group}`);
        }

        // WALLET BLOCKER LOGIC
        const total = contacts.length;
        const costPerMsg = PRICING[templateType.toLowerCase()] || PRICING.utility;
        const totalCost = total * costPerMsg;

        // Check and Debit
        await this.walletService.debitWallet(userId, totalCost, `Scheduled WhatsApp Campaign: ${campaignName}`, 'scheduled_campaign', 'whatsapp');
        this.logger.log(`[scheduleCampaign] Wallet Debit Success: ₹${totalCost} for ${total} contacts`);

        try {
            const campaign = new this.campaignModel({
                userId,
                campaignName,
                message,
                group,
                scheduledTime: scheduledAt,
                totalContacts: contacts.length,
                status: 'scheduled',
                media: media || [],
                contactIds: contactIds || [],
                templateName,
                templateParams,
            });

            const savedCampaign = await campaign.save();

            const payload: SchedulerJobPayload = {
                userId,
                campaignId: savedCampaign._id.toString(),
                group,
                message,
                media: media || [],
                contactIds: contactIds || [],
                sourceType: 'campaign',
                templateName,
                templateParams,
            };

            const now = new Date();
            const delay = Math.max(0, scheduledAt.getTime() - now.getTime());

            await this.queueService.addSchedulerJob(
                'process-bulk-campaign',
                payload,
                delay
            );

            return {
                message: 'Campaign scheduled successfully',
                campaignId: savedCampaign._id,
                scheduledAt: scheduledAt,
                totalContacts: contacts.length,
            };
        } catch (error : any) {
            this.logger.error(`[scheduleCampaign] ERROR: ${error.message}. Triggering refund for user ${userId}`);
            await this.walletService.creditWallet(userId, totalCost, `REFUND: Failed Scheduled Campaign ${campaignName}`, 'scheduled_campaign_refund', 'whatsapp');
            throw error;
        }
    }

    async getCampaigns(userId: string, page = 1, limit = 10) {
        const filter = {
            userId,
            sourceType: { $ne: 'message' }
        };
        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            this.campaignModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.campaignModel.countDocuments(filter),
        ]);
        return { records, total, page, limit };
    }

    async getTemplatesMap(): Promise<Map<string, string>> {
        // Return cached templates if still valid
        if (this.templateCache.size > 0 && (Date.now() - this.lastTemplateFetch < this.CACHE_TTL_MS)) {
            return this.templateCache;
        }

        try {
            const url = `${this.apiUrl}/${this.businessId}/message_templates`;
            const headers = {
                Authorization: `Bearer ${this.token}`,
            };

            const response = await firstValueFrom(this.httpService.get(url, { headers }));
            const templates = response.data?.data || [];

            const newCache = new Map<string, string>();
            templates.forEach((t: any) => {
                if (t.status === 'APPROVED') {
                    newCache.set(t.name.toLowerCase(), t.language);
                }
            });

            this.templateCache = newCache;
            this.lastTemplateFetch = Date.now();
            this.logger.log(`Template cache updated. Available templates: ${JSON.stringify(Array.from(this.templateCache.keys()))}`);
            return this.templateCache;
        } catch (error : any) {
            this.logger.error(`Failed to fetch templates from Meta: ${error.message}`);
            return this.templateCache; // Return old cache if fetch fails
        }
    }

    async getTemplates() {
        const map = await this.getTemplatesMap();
        return Array.from(map.keys());
    }

    async getTemplatesFull() {
        try {
            const url = `${this.apiUrl}/${this.businessId}/message_templates`;
            const headers = {
                Authorization: `Bearer ${this.token}`,
            };
            const response = await firstValueFrom(this.httpService.get(url, { headers }));
            return response.data?.data || [];
        } catch (error : any) {
            this.logger.error(`Failed to fetch full templates: ${error.message}`);
            return [];
        }
    }

    async getGroups(userId: string) {
        const groups = await this.contactModel.aggregate([
            { $match: { userId, group: { $exists: true, $ne: '' } } },
            { $group: { _id: "$group", count: { $sum: 1 } } },
            { $project: { name: "$_id", count: 1, _id: 0 } }
        ]);
        const totalContacts = await this.contactModel.countDocuments({ userId });
        return { groups, totalContacts };
    }

    getVerifyToken() {
        return this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');
    }
}
