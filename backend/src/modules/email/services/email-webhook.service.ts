import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailCampaign } from '../schemas/email-campaign.schema';
import { NotificationsGateway } from '../../notifications/notifications.gateway';

@Injectable()
export class EmailWebhookService {
  private readonly logger = new Logger(EmailWebhookService.name);

  constructor(
    @InjectModel(EmailCampaign.name) private emailCampaignModel: Model<EmailCampaign>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async handleSendGridEvents(events: any[]) {
    this.logger.log(`Received ${events.length} events from SendGrid Webhook`);

    for (const event of events) {
      const campaignId = event.campaign_id;
      const eventType = event.event; // open, bounce, spamreport, delivered, etc.

      if (!campaignId) {
        this.logger.debug(`Event skipped: No campaign_id found in event ${event.sg_event_id}`);
        continue;
      }

      try {
        let updateQuery = {};

        switch (eventType) {
          case 'open':
            updateQuery = { $inc: { openedCount: 1 } };
            break;
          case 'click':
            updateQuery = { $inc: { clickedCount: 1 } };
            break;
          case 'bounce':
          case 'dropped':
            updateQuery = { $inc: { bouncedCount: 1 } };
            break;
          case 'spamreport':
            updateQuery = { $inc: { spamCount: 1 } };
            break;
          default:
            // Other events like 'delivered', 'processed' don't need counter updates for now
            continue;
        }

        let activityType = eventType;
        if (eventType === 'spamreport') activityType = 'spam';

        const campaign = await this.emailCampaignModel.findByIdAndUpdate(
          campaignId,
          { 
            ...updateQuery,
            $push: { 
              activity: { 
                timestamp: new Date(), 
                action: activityType 
              } 
            } 
          },
          { new: true }
        );

        if (campaign) {
          this.logger.log(`[Webhook Update] Campaign ${campaignId} | Event: ${eventType}`);
          // Emit real-time update to frontend
          this.gateway.emitCampaignProgress({
            userId: campaign.userId,
            campaignId: campaign._id.toString(),
            sentCount: campaign.sentCount,
            failedCount: campaign.bouncedCount,
            openedCount: campaign.openedCount, // Added specific counts
            spamCount: campaign.spamCount,
            totalContacts: campaign.totalContacts,
            status: campaign.status
          });
        }
      } catch (err) {
        this.logger.error(`Failed to process SendGrid event for campaign ${campaignId}: ${err.message}`);
      }
    }
  }
}
