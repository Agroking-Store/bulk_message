import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from './whatsapp.controller';
import { MediaController } from './media.controller';
import { WhatsAppService } from './whatsapp.service';
import { CloudinaryConfig } from '../../config/cloudinary.config';
import { CloudinaryService } from '../../services/cloudinary.service';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { QueueModule } from '../queue/queue.module';
import { MessageHistoryModule } from '../message-history/history.module';
import { MessageStatusModule } from '../message-status/status.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module'; 




@Module({
    imports: [
        HttpModule,
        ConfigModule,
        QueueModule,
        MessageStatusModule,
        MessageHistoryModule,
        NotificationsModule,
        WalletModule,
        MongooseModule.forFeature([
            { name: Campaign.name, schema: CampaignSchema },
            { name: Contact.name, schema: ContactSchema },
        ]),
    ],
    controllers: [WhatsAppController, MediaController],
    providers: [WhatsAppService, CloudinaryConfig, CloudinaryService],
    exports: [WhatsAppService],
})
export class WhatsAppCloudModule { }
