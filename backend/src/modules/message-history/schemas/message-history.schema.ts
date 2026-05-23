import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Contact } from '../../contacts/schemas/contact.schema';

@Schema({ timestamps: true })
export class MessageHistory extends Document {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true, index: true })
    campaignId: string;

    @Prop({ type: Types.ObjectId, ref: 'Contact', required: true })
    contactId: Types.ObjectId | string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: true })
    message: string;

    @Prop({ enum: ['pending', 'sent', 'failed'], default: 'pending' })
    status: string;

    @Prop({ default: () => new Date() })
    timestamp: Date;

    @Prop({ enum: ['message', 'campaign'], index: true })
    sourceType: string;
}

export const MessageHistorySchema = SchemaFactory.createForClass(MessageHistory);
