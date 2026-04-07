import { Controller, Post, Body, Get, UseGuards, Request, Param, Put, BadRequestException } from '@nestjs/common';
import { OvertimeService } from './overtime.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('overtime')
@UseGuards(AuthGuard('jwt'))
export class OvertimeController {
  constructor(private readonly overtimeService: OvertimeService) {}

  @Get('test')
  async test() {
    return { status: 'Overtime Controller is working' };
  }

  @Post('request')
  async request(@Request() req: any, @Body() data: {
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }) {
    if (!req.user.employeeId) {
       throw new BadRequestException('User is not an employee');
    }
    return this.overtimeService.requestOvertime(req.user.employeeId, data);
  }

  @Get('my')
  async getMy(@Request() req: any) {
    if (!req.user.employeeId) {
       throw new BadRequestException('User is not an employee');
    }
    return this.overtimeService.getMyOvertime(req.user.employeeId);
  }

  @Get('pending')
  async getAllPending() {
    return this.overtimeService.getAllPendingOvertime();
  }

  @Put('approve/:id')
  async approve(
    @Param('id') id: string,
    @Body() data: { status: string; adminNote?: string }
  ) {
    return this.overtimeService.approveOvertime(id, data.status, data.adminNote);
  }
}
