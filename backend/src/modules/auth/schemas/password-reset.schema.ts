import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PasswordReset extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User' })
    userId: Types.ObjectId;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    otpHash: string;

    @Prop({ required: true, default: 0 })
    attempts: number;

    @Prop({ default: false })
    isUsed: boolean;

    @Prop()
    ipAddress: string;

    @Prop()
    userAgent: string;

    // TTL index: automatically delete document when expiresAt is reached
    @Prop({ required: true, expires: 0 })
    expiresAt: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
