import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageHistory, MessageHistorySchema } from './schemas/message-history.schema';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: MessageHistory.name, schema: MessageHistorySchema },
        ]),
    ],
    controllers: [HistoryController],
    providers: [HistoryService],
    exports: [HistoryService],
})
export class MessageHistoryModule { }
