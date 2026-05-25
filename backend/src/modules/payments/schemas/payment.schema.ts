import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Payment extends Document {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true, unique: true })
    razorpayPaymentId: string;

    @Prop({ required: true, index: true })
    razorpayOrderId: string;

    @Prop({ required: true })
    signature: string;

    @Prop({ required: true })
    amount: number; // in paise

    @Prop({ required: true })
    method: string; // e.g., card, upi, netbanking

    @Prop({ default: 'captured' })
    status: string;

    @Prop({ required: true, enum: ['whatsapp', 'email'], default: 'whatsapp' })
    serviceType: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
