import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Notification } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async createNotification(dto: CreateNotificationDto & { userId: string }): Promise<Notification> {

    const notification = new this.notificationModel({
      ...dto,
      isRead: false,
    });

    const savedNotification = await notification.save();

    // emit realtime notification to specific user room
    this.gateway.emitNotification(savedNotification);

    return savedNotification;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAllAsRead(userId: string): Promise<any> {
    return this.notificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    ).exec();
  }

  async markAsRead(id: string): Promise<Notification | null> {

    return this.notificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true },
    ).exec();
  }

  async deleteNotification(id: string): Promise<any> {
    return this.notificationModel.findByIdAndDelete(id).exec();
  }

  async deleteByMetadata(userId: string, metadataKey: string, metadataValue: any): Promise<any> {
    const query = { userId };
    query[`metadata.${metadataKey}`] = metadataValue;
    return this.notificationModel.deleteMany(query).exec();
  }
}