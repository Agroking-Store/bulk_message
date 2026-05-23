import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Campaign extends Document {
    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ required: true })
    campaignName: string;

    @Prop({ required: true })
    message: string;

    @Prop({ required: true })
    group: string;

    @Prop({ default: 0 })
    totalContacts: number;

    @Prop({ default: 0 })
    sentCount: number;

    @Prop({ default: 0 })
    failedCount: number;

    @Prop({ type: [{ url: String, type: { type: String }, originalName: String }], default: [] })
    media: { url: string; type: string; originalName?: string }[];

    @Prop({ default: 'pending', enum: ['pending', 'in-progress', 'completed', 'failed', 'scheduled'] })
    status: string;

    @Prop({ default: false })
    isScheduled: boolean;

    @Prop({ required: false })
    scheduledTime: Date;

    @Prop({ type: [String], default: [] })
    contactIds: string[];

    @Prop({ default: 'campaign', enum: ['campaign', 'message'] })
    sourceType: string;

    @Prop({ type: [String], default: [] })
    processedHistoryIds: string[];

    @Prop({ required: false })
    templateName: string;

    @Prop({ type: Object, required: false })
    templateParams: any;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
