import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueModule } from '../queue/queue.module';
import { BulkController } from './bulk.controller';
import { BulkService } from './bulk.service';
import { SendMessageWorker } from './workers/send-message.worker';
import { WhatsAppCloudModule } from '../whatsapp/whatsapp.module';
import { MessageStatusModule } from '../message-status/status.module';
import { MessageHistoryModule } from '../message-history/history.module';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { Campaign, CampaignSchema } from '../whatsapp/schemas/campaign.schema';

import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [
        QueueModule,
        MongooseModule.forFeature([
            { name: Contact.name, schema: ContactSchema },
            { name: Campaign.name, schema: CampaignSchema }
        ]),
        WhatsAppCloudModule,
        MessageStatusModule,
        MessageHistoryModule,
        NotificationsModule,
        WalletModule
    ],
    controllers: [BulkController],
    providers: [BulkService, SendMessageWorker],
    exports: [BulkService],
})
export class BulkMessagingModule { }