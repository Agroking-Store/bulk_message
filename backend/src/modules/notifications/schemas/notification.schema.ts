import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { NotificationType } from "../enums/notification-type.enum";

@Schema({ timestamps: true })
export class Notification extends Document {

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ enum: NotificationType })
  type: NotificationType;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Object })
  metadata: any;
}

export const NotificationSchema =
  SchemaFactory.createForClass(Notification);