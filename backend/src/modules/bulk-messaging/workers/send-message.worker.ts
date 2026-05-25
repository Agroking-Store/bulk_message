import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { BULK_QUEUE, BulkJobPayload } from '../../../queues/queue.processor';
import { WhatsAppService } from '../../whatsapp/whatsapp.service';
import { StatusService } from '../../message-status/status.service';
import { HistoryService } from '../../message-history/history.service';
import { Campaign } from '../../whatsapp/schemas/campaign.schema';

import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { WalletService } from '../../wallet/wallet.service';

@Processor(BULK_QUEUE, { concurrency: 5 })
@Injectable()
export class SendMessageWorker extends WorkerHost {
  private readonly logger = new Logger(SendMessageWorker.name);

  constructor(
    private readonly whatsapp: WhatsAppService,
    private readonly statusService: StatusService,
    private readonly historyService: HistoryService,
    @InjectModel(Campaign.name) private campaignModel: Model<Campaign>,
    private readonly notificationsService: NotificationsService,
    private readonly gateway: NotificationsGateway,
    private readonly walletService: WalletService
  ) {
    super();
  }

  // Removed appendLog for production

  async process(job: Job<BulkJobPayload>) {
    const { 
      userId, 
      messageId, 
      campaignId, 
      historyId, 
      contactId, 
      phone, 
      contactName,
      message, 
      media, 
      costPerMsg, 
      templateName, 
      templateParams 
    } = job.data;

    this.logger.log(`[Job Started] ID: ${job.id} for phone: ${phone}`);

    try {
      let lastWaMessageId = '';

      this.logger.log(`[Message Sending...] to ${phone}`);

      if (job.id === '1' || (job.opts?.delay === 0)) {
        await this.notificationsService.createNotification({
          userId,
          title: 'Queue Updates',
          message: 'Queue processing started',
          type: NotificationType.INFO,
          metadata: { campaignId }
        });
      }

      // PERSONALIZATION LOGIC: Replace placeholders like {{name}} and {{phone}}
      const placeholderData = { name: contactName, phone: phone };
      const processedMessage = this.replacePlaceholders(message, placeholderData);
      
      let processedTemplateParams = templateParams;
      if (templateParams) {
        processedTemplateParams = JSON.parse(JSON.stringify(templateParams)); // Deep copy
        
        if (processedTemplateParams.body) {
          processedTemplateParams.body = processedTemplateParams.body.map((val: string) => 
            this.replacePlaceholders(val, placeholderData)
          );
        }
        
        if (processedTemplateParams.buttons) {
          processedTemplateParams.buttons = processedTemplateParams.buttons.map((btn: any) => ({
            ...btn,
            url_suffix: this.replacePlaceholders(btn.url_suffix, placeholderData)
          }));
        }
      }

      // If there's no media, just send the text message
      if (!media || media.length === 0) {
        lastWaMessageId = (await this.whatsapp.sendMessage(phone, processedMessage, undefined, 'text', templateName, processedTemplateParams)) || '';
      } else {
        for (let i = 0; i < media.length; i++) {
          const item = media[i];
          const caption = i === 0 ? processedMessage : '';
          const waId = await this.whatsapp.sendMessage(
            phone,
            caption,
            item.url,
            item.type,
            templateName,
            processedTemplateParams
          );
          if (waId) lastWaMessageId = waId;
        }
      }

      if (!lastWaMessageId) {
        throw new Error('Failed to send message via WhatsApp API');
      }

      this.logger.log(`[Message Sent] ID: ${lastWaMessageId}`);
      await this.statusService.updateStatus(messageId, 'sent', lastWaMessageId);
      this.logger.log(`[Status Updated] messageId: ${messageId} -> sent`);

      // Emit real-time status update
      this.gateway.emitMessageStatusUpdate({
        userId,
        messageId,
        status: 'sent',
        phone,
        campaignId
      });

      // ALWAYS update the specific history record using historyId
      await this.historyService.updateById(historyId, {
        status: 'sent',
        timestamp: new Date()
      });

      // Increment sent count and check for completion
      if (campaignId.length === 24) {
        await this.incrementCampaignStats(campaignId, 'sent', historyId);
      }

      this.logger.log(`Job ${job.id} [${campaignId}] Successfully sent to ${phone}`);

    } catch (err: any) {
      const error = err?.response?.data?.error?.message ?? err?.message ?? 'Unknown error';

      if (error.includes('expired') || error.includes('token')) {
        this.logger.error(`CRITICAL ERROR: WHATSAPP_ACCESS_TOKEN might be expired or invalid: ${error}`);
      }

      this.logger.error(`[Message Failed] for phone: ${phone}. Error: ${error}`);
      await this.statusService.updateStatus(messageId, 'failed', undefined, error);
      this.logger.log(`[Status Updated] messageId: ${messageId} -> failed`);

      // ALWAYS update the specific history record using historyId
      await this.historyService.updateById(historyId, {
        status: 'failed',
        timestamp: new Date()
      });

      if (campaignId.length === 24) {
        await this.incrementCampaignStats(campaignId, 'failed', historyId);
      }

      // Emit real-time status update
      this.gateway.emitMessageStatusUpdate({
        userId,
        messageId,
        status: 'failed',
        phone,
        campaignId
      });

      this.logger.error(`Job ${job.id} [${campaignId}] Failed for ${phone}: ${error}`);

      // AUTOMATIC REFUND LOGIC
      if (costPerMsg && costPerMsg > 0) {
        try {
          this.logger.log(`[REFUND] Triggering refund of ₹${costPerMsg} for user ${userId} due to failure at ${phone}`);
          await this.walletService.creditWallet(
            userId, 
            costPerMsg, 
            `Refund: Message Failure (${phone})`, 
            campaignId || 'failure-refund',
            'whatsapp'
          );
        } catch (refundErr: any) {
          this.logger.error(`[REFUND FAILED] Failed to refund ₹${costPerMsg} to user ${userId}: ${refundErr.message}`);
        }
      }

      // We no longer trigger individual UI notifications for each failed message in a bulk campaign
      // to avoid spamming the user. The final campaign summary handles this.

      // Throw for retries only if it's a network/server error (5xx) or rate limit (429)
      const status = err?.response?.status;
      if (status && (status >= 500 || status === 429)) {
        throw err;
      }
    }
  }

  private async incrementCampaignStats(
    campaignId: string,
    type: 'sent' | 'failed',
    historyId: string
  ) {
    try {
      const updateField = type === 'sent' ? { sentCount: 1 } : { failedCount: 1 };

      const campaign = await this.campaignModel.findOneAndUpdate(
        { _id: campaignId, processedHistoryIds: { $ne: historyId } },
        {
          $inc: updateField,
          $addToSet: { processedHistoryIds: historyId }
        },
        { new: true }
      );

      if (!campaign) {
        this.logger.debug(`[${campaignId}] Stats already updated for historyId: ${historyId}`);
        return;
      }

      const processed = campaign.sentCount + campaign.failedCount;
      const total = campaign.totalContacts;

      this.logger.log(`[${campaignId}] Stats: processed=${processed}/${total} (sent=${campaign.sentCount}, failed=${campaign.failedCount})`);

      // Emit real-time progress
      this.gateway.emitCampaignProgress({
        userId: campaign.userId,
        campaignId,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        totalContacts: total,
        status: campaign.status
      });

      // Mark complete when all expected contacts have been processed
      if (total > 0 && processed >= total && campaign.status !== 'completed') {
        const updatedCampaign = await this.campaignModel.findOneAndUpdate(
          { _id: campaignId, status: { $ne: 'completed' } },
          { status: 'completed' },
          { new: true }
        );

        if (!updatedCampaign) return;

        this.logger.log(`[${campaignId}] COMPLETED! Sent=${updatedCampaign.sentCount}, Failed=${updatedCampaign.failedCount}`);

        // Emit final status
        this.gateway.emitCampaignProgress({
          userId: updatedCampaign.userId,
          campaignId,
          sentCount: updatedCampaign.sentCount,
          failedCount: updatedCampaign.failedCount,
          totalContacts: total,
          status: 'completed'
        });

        // Notifications logic
        // We always use SUCCESS (green) for the final completion notification as requested,
        // since the specific sent/failed counts are already detailed in the message.
        const title = 'Campaign Sent';
        const typeNotification = NotificationType.SUCCESS;

        await this.notificationsService.createNotification({
          userId: updatedCampaign.userId,
          title,
          message: `Processed: ${processed}/${total}. Sent: ${updatedCampaign.sentCount}, Failed: ${updatedCampaign.failedCount}`,
          type: typeNotification
        });

        // Delete temporary queue and start notifications for this campaign
        try {
          await this.notificationsService.deleteByMetadata(updatedCampaign.userId, 'campaignId', campaignId);

          // Emit a special websocket event to tell the frontend to remove these notifications from the UI
          this.gateway.server.to(`user:${updatedCampaign.userId}`).emit('remove-campaign-notifications', { campaignId });
        } catch (e) {
          this.logger.error(`Failed to delete temporary notifications for campaign ${campaignId}: ${e.message}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to update stats for campaign ${campaignId}: ${error.message}`
      );
    }
  }

  private replacePlaceholders(text: string, data: { name: string; phone: string }): string {
    if (!text || typeof text !== 'string') return text;
    return text
      .replace(/\{\{name\}\}/gi, data.name || '')
      .replace(/\{\{phone\}\}/gi, data.phone || '');
  }
}
