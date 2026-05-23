import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageStatusRecord, MessageStatus } from './schemas/message-status.schema';

@Injectable()
export class StatusService {
    constructor(
        @InjectModel(MessageStatusRecord.name)
        private readonly statusModel: Model<MessageStatusRecord>,
    ) { }

    async createPending(data: {
        messageId: string;
        campaignId: string;
        contactId: string;
        phone: string;
    }) {
        return this.statusModel.create({ ...data, status: 'pending' });
    }

    async updateStatus(
        messageId: string,
        status: MessageStatus,
        waMessageId?: string,
        error?: string,
    ) {
        return this.statusModel.findOneAndUpdate(
            { messageId },
            { status, ...(waMessageId && { waMessageId }), ...(error && { error }) },
            { new: true },
        );
    }

    async findByMessageId(messageId: string) {
        const record = await this.statusModel.findOne({ 
            messageId,
            status: { $ne: 'pending' } 
        });
        if (!record) throw new NotFoundException(`Message ${messageId} not found or still processing`);
        return record;
    }
}
