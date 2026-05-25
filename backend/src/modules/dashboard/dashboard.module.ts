import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { User, UserSchema } from '../auth/auth.module';
import { MessageHistory, MessageHistorySchema } from '../message-history/schemas/message-history.schema';
import { Campaign, CampaignSchema } from '../whatsapp/schemas/campaign.schema';
import { EmailCampaign, EmailCampaignSchema } from '../email/schemas/email-campaign.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Contact.name, schema: ContactSchema },
            { name: MessageHistory.name, schema: MessageHistorySchema },
            { name: Campaign.name, schema: CampaignSchema },
            { name: EmailCampaign.name, schema: EmailCampaignSchema },
            { name: 'User', schema: UserSchema }
        ])
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
