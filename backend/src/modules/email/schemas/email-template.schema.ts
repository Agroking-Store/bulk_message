import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class TemplateMedia {
  @Prop({ required: true })
  url: string;

  @Prop()
  type: string;

  @Prop()
  originalName: string;
}

@Schema({ _id: false })
export class TemplateHistory {
  @Prop({ required: true })
  action: string; // 'CREATED' | 'UPDATED'

  @Prop({ required: true, default: Date.now })
  changedAt: Date;
}

export type EmailTemplateDocument = EmailTemplate & Document;

@Schema({ timestamps: true })
export class EmailTemplate {
  @Prop({ required: true })
  userId: string;
  
  @Prop({ required: true })
  name: string;

  @Prop()
  subject: string;

  @Prop()
  body: string;

  @Prop({ type: [TemplateMedia], default: [] })
  attachments: TemplateMedia[];

  @Prop()
  footer: string;

  @Prop({ type: [TemplateHistory], default: [] })
  history: TemplateHistory[];
}

export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);
