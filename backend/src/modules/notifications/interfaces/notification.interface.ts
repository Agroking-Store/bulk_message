import { NotificationType } from '../enums/notification-type.enum';

export interface Notification {
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}