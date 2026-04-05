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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('test-push')
  @ApiOperation({ summary: 'Send a test push notification to yourself' })
  async testPush(@Request() req: any) {
    const userId = req.user.userId || req.user.sub;
    await this.notificationService.notifyUser(
      userId,
      'Test Push Notification',
      'Halo! Ini adalah pesan percobaan push notification.',
      { screen: 'Home', timestamp: new Date().toISOString() }
    );
    return { success: true, message: 'Test notification sent' };
  }
  
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('test-push/:userId')
  @ApiOperation({ summary: 'Send a test push notification to a specific user by ID' })
  async testPushToUser(@Param('userId') userId: string) {
    await this.notificationService.notifyUser(
      userId,
      'Test Push Notification',
      'Halo! Ini adalah pesan percobaan push notification dari Admin.',
      { screen: 'Home', timestamp: new Date().toISOString() }
    );
    return { success: true, message: `Test notification sent to user ${userId}` };
  }
}
