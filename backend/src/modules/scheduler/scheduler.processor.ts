import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SCHEDULER_QUEUE, SchedulerJobPayload } from '../../queues/queue.processor';
import { BulkService } from '../bulk-messaging/bulk.service';
import { UserEmailService } from '../email/services/user-email.service';
import { Campaign } from '../whatsapp/schemas/campaign.schema';

// WorkerOptions: stalledInterval=2s ensures delayed jobs are checked every 2 seconds
// instead of the default 30 seconds, giving near-instant scheduling precision.
@Processor(SCHEDULER_QUEUE, {
    stalledInterval: 2000, // 2 seconds
    maxStalledCount: 1,
})
export class SchedulerProcessor extends WorkerHost {
    private readonly logger = new Logger(SchedulerProcessor.name);

    constructor(
        private readonly bulkService: BulkService,
        private readonly userEmailService: UserEmailService,
        @InjectModel(Campaign.name) private readonly campaignModel: Model<Campaign>,
    ) {
        super();
    }

    async process(job: Job<SchedulerJobPayload>): Promise<any> {
        const jobData = job.data;
        const { campaignId, userId } = jobData;

        this.logger.log(`Scheduled job ${job.id} firing for CampaignId: ${campaignId} (Type: ${jobData.type || 'whatsapp'})`);

        if (jobData.type === 'email') {
            try {
                this.logger.log(`Dispatching scheduled email campaign: ${campaignId}`);
                await this.userEmailService.triggerScheduledCampaign(userId, campaignId);
                return { success: true, type: 'email' };
            } catch (err) {
                this.logger.error(`Scheduled email campaign ${campaignId} dispatch failed: ${(err as Error).message}`);
                throw err;
            }
        }

        // --- 1. Resolve campaign from DB to get fresh, authoritative data ---
        let resolvedUserId = userId;
        let group = jobData.group;
        let message = jobData.message;
        let contactIds = jobData.contactIds;
        let media = jobData.media;

        if (campaignId && campaignId.length === 24) {
            try {
                const campaign = await this.campaignModel.findById(campaignId).lean();
                if (campaign) {
                    resolvedUserId = (campaign as any).userId?.toString() || resolvedUserId;
                    group = (campaign as any).group || group;
                    message = (campaign as any).message || message;
                    contactIds = (campaign as any).contactIds?.length > 0 ? (campaign as any).contactIds : contactIds;
                    media = (campaign as any).media?.length > 0 ? (campaign as any).media : media;
                    jobData.templateName = (campaign as any).templateName || jobData.templateName;
                    jobData.templateParams = (campaign as any).templateParams || jobData.templateParams;
                } else {
                    this.logger.warn(`WARNING: Campaign ${campaignId} not found in DB. Using job payload data.`);
                }

                await this.campaignModel.findByIdAndUpdate(campaignId, { status: 'in-progress' });
            } catch (err) {
                this.logger.error(`Failed to initialize scheduled campaign ${campaignId}: ${(err as Error).message}`);
            }
        }

        if (!resolvedUserId) {
            this.logger.error(`CRITICAL: No userId available for job ${job.id}. Aborting.`);
            if (campaignId && campaignId.length === 24) {
                await this.campaignModel.findByIdAndUpdate(campaignId, { status: 'failed' });
            }
            throw new Error(`No userId available for scheduled job ${job.id}`);
        }

        // --- 2. Dispatch to BulkService ---
        try {
            const result = await this.bulkService.sendBulk(resolvedUserId, {
                message,
                campaignId,
                group,
                contactIds,
                media,
                templateName: jobData.templateName,
                templateParams: jobData.templateParams
            });
            const actualQueued = result?.queued || 0;
            this.logger.log(`Scheduled job ${job.id} [${campaignId}] successfully dispatched ${actualQueued} messages`);
        } catch (err) {
            this.logger.error(`Scheduled campaign ${campaignId} dispatch failed: ${(err as Error).message}`);

            if (campaignId && campaignId.length === 24) {
                await this.campaignModel.findByIdAndUpdate(campaignId, { status: 'failed' });
            }
            throw err;
        }
    }
}
