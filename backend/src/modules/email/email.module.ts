import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailController } from './email.controller';
import { UserEmailService } from './services/user-email.service';
import { SendGridService } from './services/sendgrid.service';
import { EmailCampaign, EmailCampaignSchema } from './schemas/email-campaign.schema';
import { EmailTemplate, EmailTemplateSchema } from './schemas/email-template.schema';
import { ContactsModule } from '../contacts/contacts.module';
import { WalletModule } from '../wallet/wallet.module';
import { QueueModule } from '../queue/queue.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailWorker } from './workers/email.worker';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailCampaign.name, schema: EmailCampaignSchema },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
    ]),
    ContactsModule,
    WalletModule,
    NotificationsModule,
    QueueModule,
  ],
  controllers: [EmailController],
  providers: [
    UserEmailService,
    SendGridService,
    EmailWorker
  ],
  exports: [UserEmailService, SendGridService]
})
export class EmailModule { }