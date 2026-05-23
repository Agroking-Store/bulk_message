import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageStatusRecord, MessageStatusSchema } from './schemas/message-status.schema';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { StatusCleanupService } from './status-cleanup.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: MessageStatusRecord.name, schema: MessageStatusSchema },
        ]),
    ],
    controllers: [StatusController],
    providers: [StatusService, StatusCleanupService],
    exports: [StatusService],
})
export class MessageStatusModule { }
