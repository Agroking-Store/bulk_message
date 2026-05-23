import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';

import { EMAIL_BULK_QUEUE, EmailBulkJobPayload } from '../../../queues/queue.processor';
import { EmailCampaign } from '../schemas/email-campaign.schema';
import { SendGridService } from '../services/sendgrid.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { WalletService } from '../../wallet/wallet.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';

@Processor(EMAIL_BULK_QUEUE, { concurrency: 2 })
@Injectable()
export class EmailWorker extends WorkerHost {
  private readonly logger = new Logger(EmailWorker.name);

  constructor(
    @InjectModel(EmailCampaign.name) private emailCampaignModel: Model<EmailCampaign>,
    private readonly sendGridService: SendGridService,
    private readonly gateway: NotificationsGateway,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<EmailBulkJobPayload>) {
    const { 
      userId, 
      campaignId, 
      recipient, 
      subject, 
      body, 
      media 
    } = job.data;

    this.logger.log(`[Email Job Started] ID: ${job.id} for recipient: ${recipient}`);

    try {
      // 1. Prepare attachments if any
      const attachments = [];
      if (media && media.length > 0) {
        for (const item of media) {
          try {
            const response = await axios.get(item.url, { responseType: 'arraybuffer', timeout: 10000 });
            const base64Content = Buffer.from(response.data).toString('base64');
            attachments.push({
              content: base64Content,
              filename: item.originalName || item.url.split('/').pop() || 'attachment',
              type: response.headers['content-type'] || 'application/octet-stream',
              disposition: 'attachment'
            });
          } catch (err) {
            this.logger.error(`[EmailWorker] Failed to fetch attachment from ${item.url}: ${err.message}`);
          }
        }
      }

      // 2. Send via SendGrid
      await this.sendGridService.sendEmail({
        to: recipient,
        subject: subject,
        text: body,
        html: body,
        attachments,
        customArgs: {
          campaign_id: campaignId.toString()
        }
      });

      // 3. Idempotent update of campaign stats
      const campaign = await this.emailCampaignModel.findOneAndUpdate(
        { _id: campaignId, processedRecipients: { $ne: recipient } },
        { 
          $inc: { sentCount: 1 },
          $addToSet: { processedRecipients: recipient },
          $push: { 
            activity: { 
              timestamp: new Date(), 
              action: 'sent' 
            } 
          }
        },
        { new: true }
      );

      if (campaign) {
        this.emitProgress(campaign);
        this.checkCompletion(campaign);
      }

      this.logger.log(`[Email Job Success] sent to ${recipient}`);

    } catch (err: any) {
      this.logger.error(`[Email Job Failed] for ${recipient}: ${err.message}`);
      
      const campaign = await this.emailCampaignModel.findOneAndUpdate(
        { _id: campaignId, processedRecipients: { $ne: recipient } },
        { 
          $inc: { bouncedCount: 1, failedCount: 1 },
          $addToSet: { processedRecipients: recipient },
          $push: { activity: { timestamp: new Date(), action: 'bounced' } }
        },
        { new: true }
      );

      // Refund the un-sent email cost directly to the user's email balance
      try {
        await this.walletService.creditWallet(
          userId, 
          0.10, 
          `REFUND: Failed to dispatch Email to ${recipient}`, 
          campaignId.toString(), 
          'email'
        );
        this.logger.log(`[EmailWorker] Refunded ₹0.10 for failed email to ${recipient}`);
      } catch (refundError) {
        this.logger.error(`[EmailWorker] Failed to process refund for ${recipient}: ${refundError.message}`);
      }

      if (campaign) {
        this.emitProgress(campaign);
        this.checkCompletion(campaign);
      }
    }
  }

  private async checkCompletion(campaign: any) {
    const processed = campaign.sentCount + (campaign.failedCount || campaign.bouncedCount || 0);
    if (processed >= campaign.totalContacts && campaign.status !== 'completed') {
        await this.emailCampaignModel.updateOne(
            { _id: campaign._id, status: { $ne: 'completed' } },
            { status: 'completed' }
        );
        this.logger.log(`[Email Campaign COMPLETED] ID: ${campaign._id}`);

        // Handle Notifications Transition: Remove "progress" bar and replace with "SUCCESS" Summary
        try {
          await this.notificationsService.deleteByMetadata(campaign.userId, 'campaignId', campaign._id.toString());
          
          await this.notificationsService.createNotification({
            userId: campaign.userId,
            title: 'Email Campaign Sent',
            message: `Processed: ${processed}/${campaign.totalContacts}. Sent: ${campaign.sentCount}, Failed: ${campaign.failedCount || campaign.bouncedCount || 0}`,
            type: NotificationType.SUCCESS
          });

          // Instruct the frontend to drop the internal progress bar toast
          this.gateway.server.to(`user:${campaign.userId}`).emit('remove-campaign-notifications', { campaignId: campaign._id.toString() });
        } catch (e) {
          this.logger.error(`[EmailWorker] Failed to generate completion notification for campaign ${campaign._id}: ${e.message}`);
        }
    }
  }

  private emitProgress(campaign: any) {
    this.gateway.emitCampaignProgress({
      userId: campaign.userId,
      campaignId: campaign._id.toString(),
      sentCount: campaign.sentCount,
      failedCount: campaign.bouncedCount,
      totalContacts: campaign.totalContacts,
      status: campaign.status
    });
  }
}
