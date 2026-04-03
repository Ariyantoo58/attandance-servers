import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(employeeId: string, title: string, message: string, type?: string) {
    return this.prisma.notification.create({
      data: {
        employeeId,
        title,
        message,
        type: type || 'INFO',
      },
    });
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
}
