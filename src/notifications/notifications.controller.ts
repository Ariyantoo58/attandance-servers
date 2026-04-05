import { Controller, Get, Param, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('notifications')
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('push-token')
  @ApiOperation({ summary: 'Update push notification token for current user' })
  async updatePushToken(@Request() req: any, @Body('token') token: string) {
    const userId = req.user.userId || req.user.sub;
    return this.notificationService.updatePushToken(userId, token);
  }
}
