import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageStatus = 'pending' | 'sent' | 'failed';

@Schema({ timestamps: true })
export class MessageStatusRecord extends Document {
    @Prop({ required: true, index: true })
    messageId: string;

    @Prop({ required: true })
    campaignId: string;

    @Prop({ required: true })
    contactId: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ enum: ['pending', 'sent', 'failed'], default: 'pending' })
    status: MessageStatus;

    @Prop()
    waMessageId: string;

    @Prop()
    error: string;
}

export const MessageStatusSchema = SchemaFactory.createForClass(MessageStatusRecord);
