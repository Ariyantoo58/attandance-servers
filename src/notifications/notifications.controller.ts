import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationService } from './notifications.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('employee/:employeeId')
  async getEmployeeNotifications(@Param('employeeId') employeeId: string) {
    return this.notificationService.getEmployeeNotifications(employeeId);
  }

  @Patch('mark-read/:id')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
