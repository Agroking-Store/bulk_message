import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';

import { Contact, ContactSchema } from './schemas/contact.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contact.name, schema: ContactSchema }
    ]),
    NotificationsModule
  ],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService]
})
export class ContactsModule {}