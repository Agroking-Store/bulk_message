import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WalletTransaction extends Document {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true, enum: ['credit', 'debit'] })
    type: string;

    @Prop({ required: true })
    amount: number; // in rupees (can be float)

    @Prop({ required: true })
    reason: string; // e.g., 'Wallet Recharge', 'Bulk Message Cost'

    @Prop({ required: true })
    balanceAfter: number;

    @Prop({ required: false })
    referenceId: string; // Order ID or Campaign ID

    @Prop({ required: true, enum: ['whatsapp', 'email'], default: 'whatsapp' })
    serviceType: string;
}

export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);
