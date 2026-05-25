import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TemplateDocument = Template & Document;

@Schema({ timestamps: true })
export class Template {
  @Prop()
  name: string;

  @Prop()
  language: string;

  @Prop()
  category: string;

  @Prop({
    default: 'PENDING',
  })
  status: string;
}

export const TemplateSchema =
  SchemaFactory.createForClass(Template);