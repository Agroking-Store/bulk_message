import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Template extends Document {

  @Prop()
  name: string;

  @Prop()
  status: string;

  @Prop()
  category: string;

  @Prop()
  language: string;

}

export const TemplateSchema = SchemaFactory.createForClass(Template);