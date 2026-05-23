import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Order extends Document {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true, unique: true })
    razorpayOrderId: string;

    @Prop({ required: true })
    amount: number; // in paise

    @Prop({ default: 'INR' })
    currency: string;

    @Prop({ default: 'created', enum: ['created', 'paid', 'failed'] })
    status: string;

    @Prop({ required: true, enum: ['whatsapp', 'email'], default: 'whatsapp' })
    serviceType: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
