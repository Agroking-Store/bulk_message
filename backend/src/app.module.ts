import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/mongo.module';

import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ComposerModule } from './modules/message-composer/composer.module';
import { BulkMessagingModule } from './modules/bulk-messaging/bulk.module';
import { MessageStatusModule } from './modules/message-status/status.module';
import { MessageHistoryModule } from './modules/message-history/history.module';
import { WhatsAppCloudModule } from './modules/whatsapp/whatsapp.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { QueueModule } from './modules/queue/queue.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ProfileModule } from './modules/profile/profile.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentModule } from './modules/payments/payment.module';
import { TemplateModule } from './modules/template/template.module';
import { EmailModule } from './modules/email/email.module';
import { WebhookModule } from './webhook/webhook.module';

import { WebhookController } from './webhook/webhook.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    DatabaseModule,

    AuthModule,
    DashboardModule,
    ContactsModule,
    ComposerModule,
    WhatsAppCloudModule,
    MessageStatusModule,
    MessageHistoryModule,
    BulkMessagingModule,
    SchedulerModule,
    ReportsModule,
    ProfileModule,
    NotificationsModule,
    WalletModule,
    PaymentModule,
    TemplateModule,
    EmailModule,
    WebhookModule,
  ],
})
export class AppModule { }