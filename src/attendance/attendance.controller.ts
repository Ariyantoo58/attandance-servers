import { Controller, Post, Get, Body, Param, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('attendance')
export class AttendanceController {

  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @ApiOperation({ summary: 'Clock in employee' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        employeeId: { type: 'string', example: 'uuid-string' },
        location: { type: 'string', example: 'Office - 1st Floor' },
        deviceInfo: { type: 'string', example: 'Android SM-G960F' },
      },
      required: ['employeeId'],
    },
  })
  @ApiResponse({ status: 201, description: 'The attendance record has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Already clocked in for today or missing ID.' })
  async clockIn(@Body() body: { employeeId: string; location?: string; deviceInfo?: string; latitude?: number; longitude?: number }) {
    if (!body.employeeId) throw new BadRequestException('Employee ID is required');
    return this.attendanceService.clockIn(body.employeeId, body.location, body.deviceInfo, body.latitude, body.longitude);
  }

  @Post('clock-out')
  @ApiOperation({ summary: 'Clock out employee' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        employeeId: { type: 'string', example: 'uuid-string' },
      },
      required: ['employeeId'],
    },
  })
  @ApiResponse({ status: 200, description: 'The attendance record has been successfully updated with clock-out time.' })
  @ApiResponse({ status: 400, description: 'Not clocked in for today or already clocked out.' })
  async clockOut(@Body() body: { employeeId: string; latitude?: number; longitude?: number; location?: string }) {
    if (!body.employeeId) throw new BadRequestException('Employee ID is required');
    return this.attendanceService.clockOut(body.employeeId, body.latitude, body.longitude, body.location);
  }

  @Get('history/:employeeId')
  @ApiOperation({ summary: 'Get attendance history for an employee' })
  @ApiParam({ name: 'employeeId', type: 'string' })
  @ApiQuery({ name: 'skip', type: 'number', required: false, description: 'Number of records to skip' })
  @ApiQuery({ name: 'take', type: 'number', required: false, description: 'Number of records to take' })
  @ApiResponse({ status: 200, description: 'Return attendance records.' })
  async getHistory(
    @Param('employeeId') employeeId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.attendanceService.getAttendanceHistory(employeeId, skip ? Number(skip) : undefined, take ? Number(take) : undefined);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get daily attendance for all employees' })
  @ApiQuery({ name: 'date', type: 'string', required: false, description: 'Date string (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Return daily attendance list.' })
  async getDaily(@Query('date') dateString: string) {
    const date = dateString ? new Date(dateString) : new Date();
    return this.attendanceService.getDailyAttendance(date);
  }
}

