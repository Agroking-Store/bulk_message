import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class EmailCampaign extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  body: string;

  @Prop({ required: false })
  campaignName: string;

  @Prop({ default: 'campaign', enum: ['campaign', 'message'] })
  sourceType: string;

  @Prop()
  group: string;

  @Prop({ default: 0 })
  totalContacts: number;

  @Prop({ default: 0 })
  sentCount: number;

  @Prop({ default: 0 })
  openedCount: number;

  @Prop({ default: 0 })
  clickedCount: number;

  @Prop({ default: 0 })
  spamCount: number;

  @Prop({ default: 0 })
  bouncedCount: number;

  @Prop({ default: 0 })
  failedCount: number;

  @Prop({ default: 'pending', enum: ['pending', 'sending', 'in-progress', 'completed', 'failed', 'scheduled'] })
  status: string;

  @Prop({ default: false })
  isScheduled: boolean;

  @Prop({ required: false })
  scheduledTime: Date;

  @Prop({ type: [String], default: [] })
  contactIds: string[];

  @Prop({ type: [Object], default: [] })
  media: { url: string; type: string; originalName?: string }[];

  @Prop({ default: 0 })
  totalRecipients: number;
  @Prop({
  type: [
    {
      action: String,
      timestamp: Date
    }
  ],
  default: []
})
activity: { action: string; timestamp: Date }[];
}

export const EmailCampaignSchema = SchemaFactory.createForClass(EmailCampaign);