import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Contact extends Document {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: false })
    email: string;

    @Prop({ required: false })
    group: string;
}

export const ContactSchema = SchemaFactory.createForClass(Contact);
ContactSchema.index({ userId: 1, phone: 1 }, { unique: true });
ContactSchema.index({ userId: 1, email: 1 }, { unique: true, sparse: true });
