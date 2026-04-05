import { Injectable, Logger } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationService {
  private logger: Logger = new Logger('NotificationService');
  private expo = new Expo();

  constructor(
    private socketGateway: SocketGateway,
    private prisma: PrismaService,
  ) {}

  /**
   * Send a real-time event to a user and optionally a push notification.
   */
  async notifyUser(userId: string, title: string, message: string, data?: any) {
    // 1. Send real-time event via Socket.io
    this.socketGateway.sendToUser(userId, 'notification', { title, message, data });

    // 2. Send push notification if token exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.pushToken && Expo.isExpoPushToken(user.pushToken)) {
      await this.sendPush(user.pushToken, title, message, data);
    }
  }

  /**
   * Notify all HR staff.
   */
  async notifyHR(title: string, message: string, data?: any) {
    // 1. Send real-time event via Socket.io to HR room
    this.socketGateway.sendToHR('notification', { title, message, data });

    // 2. Send push notifications to all users with HR role
    const hrs = await this.prisma.user.findMany({
      where: { role: { in: ['HR', 'ADMIN'] } },
    });

    const messages: ExpoPushMessage[] = [];
    for (const hr of hrs) {
      if (hr.pushToken && Expo.isExpoPushToken(hr.pushToken)) {
        messages.push({
          to: hr.pushToken,
          sound: 'default',
          title,
          body: message,
          data,
        });
      }
    }

    if (messages.length > 0) {
      await this.sendPushBatch(messages);
    }
  }

  /**
   * Internal helper for batch sending push notifications.
   */
  private async sendPushBatch(messages: ExpoPushMessage[]) {
    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        await this.expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        this.logger.error(`Error sending push notification chunk: ${error.message}`);
      }
    }
  }

  /**
   * Internal helper for individual push notification.
   */
  private async sendPush(token: string, title: string, body: string, data?: any) {
    await this.sendPushBatch([{ to: token, title, body, data, sound: 'default' }]);
  }

  /**
   * Broadcast real-time event to all users.
   */
  broadcast(event: string, data: any) {
    this.socketGateway.broadcast(event, data);
  }

  async getEmployeeNotifications(employeeId: string) {
    return this.prisma.notification.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async updatePushToken(userId: string, token: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: token },
    });
  }
}
