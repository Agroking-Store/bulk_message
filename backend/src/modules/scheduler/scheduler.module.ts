import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueModule } from '../queue/queue.module';
import { SchedulerProcessor } from './scheduler.processor';
import { SchedulerService } from './scheduler.service';
import { BulkMessagingModule } from '../bulk-messaging/bulk.module';
import { EmailModule } from '../email/email.module';
import { Campaign, CampaignSchema } from '../whatsapp/schemas/campaign.schema';

@Module({
    imports: [
        QueueModule,
        BulkMessagingModule,
        EmailModule,
        MongooseModule.forFeature([{ name: Campaign.name, schema: CampaignSchema }])
    ],
    providers: [SchedulerService, SchedulerProcessor],
    exports: [SchedulerService],
})
export class SchedulerModule { }
