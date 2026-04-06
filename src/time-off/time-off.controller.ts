import { Controller, Post, Get, Body, Param, Patch, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { TimeOffService } from './time-off.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('time-off')
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('update-status/:id')
  async updateStatus(
    @Param('id') id: string, 
    @Body() body: { status: string },
    @Request() req: any
  ) {
    return this.timeOffService.updateStatus(id, body.status, req.user.employeeId, req.user.role);
  }
}
