import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AuthModule } from '../auth/auth.module';
import { Campaign, CampaignSchema } from '../whatsapp/schemas/campaign.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { MessageHistory, MessageHistorySchema } from '../message-history/schemas/message-history.schema';
import { EmailCampaign, EmailCampaignSchema } from '../email/schemas/email-campaign.schema';

@Module({
    imports: [
        AuthModule,
        MongooseModule.forFeature([
            { name: Campaign.name, schema: CampaignSchema },
            { name: Contact.name, schema: ContactSchema },
            { name: MessageHistory.name, schema: MessageHistorySchema },
            { name: EmailCampaign.name, schema: EmailCampaignSchema },
        ]),
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
})
export class ReportsModule { }
