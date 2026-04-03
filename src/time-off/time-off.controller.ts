import { Controller, Post, Get, Body, Param, Patch } from '@nestjs/common';
import { TimeOffService } from './time-off.service';

@Controller('time-off')
export class TimeOffController {
  constructor(private readonly timeOffService: TimeOffService) {}

  @Post('request')
  async request(@Body() body: {
    employeeId: string;
    title: string;
    description?: string;
    fromdate: string;
    todate: string;
    type?: string;
  }) {
    return this.timeOffService.createRequest(body);
  }

  @Get('employee/:employeeId')
  async getEmployeeRequests(@Param('employeeId') employeeId: string) {
    return this.timeOffService.getRequestsByEmployee(employeeId);
  }

  @Get('all')
  async getAll() {
    return this.timeOffService.getAllRequests();
  }

  @Patch('update-status/:id')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string; approvedBy?: string }) {
    return this.timeOffService.updateStatus(id, body.status, body.approvedBy);
  }
}
