import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {

  constructor(private readonly service: NotificationsService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto, @Req() req: any) {
    return this.service.createNotification({ ...dto, userId: req.user.userId });
  }

  @Get()
  getAll(@Req() req: any) {
    return this.service.getNotifications(req.user.userId);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    return this.service.markAllAsRead(req.user.userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deleteNotification(id);
  }
}