import { Controller, Post, Get, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  async clockIn(@Body() body: { employeeId: string; location?: string; deviceInfo?: string }) {
    if (!body.employeeId) throw new BadRequestException('Employee ID is required');
    return this.attendanceService.clockIn(body.employeeId, body.location, body.deviceInfo);
  }

  @Post('clock-out')
  async clockOut(@Body() body: { employeeId: string }) {
    if (!body.employeeId) throw new BadRequestException('Employee ID is required');
    return this.attendanceService.clockOut(body.employeeId);
  }

  @Get('history/:employeeId')
  async getHistory(@Param('employeeId') employeeId: string) {
    return this.attendanceService.getAttendanceHistory(employeeId);
  }

  @Get('daily')
  async getDaily(@Query('date') dateString: string) {
    const date = dateString ? new Date(dateString) : new Date();
    return this.attendanceService.getDailyAttendance(date);
  }
}
