import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: true,
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    if (userId) {
      client.join(`user:${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    // Socket automatically leaves rooms on disconnect
  }

  emitNotification(notification: any) {
    if (notification.userId) {
      this.server.to(`user:${notification.userId}`).emit('new-notification', notification);
    } else {
      this.server.emit('new-notification', notification);
    }
  }

  emitCampaignProgress(data: { 
    userId: string,
    campaignId: string, 
    sentCount: number, 
    failedCount: number, 
    openedCount?: number,
    spamCount?: number,
    totalContacts: number,
    status: string 
  }) {
    this.server.to(`user:${data.userId}`).emit('campaign-progress', data);
  }

  emitMessageStatusUpdate(data: {
    userId: string,
    messageId: string,
    status: string,
    phone: string,
    campaignId?: string
  }) {
    this.server.to(`user:${data.userId}`).emit('message-status-updated', data);
  }
}