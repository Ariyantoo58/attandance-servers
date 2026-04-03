import { Controller, Get } from '@nestjs/common';
import { HrDashboardService } from './hr-dashboard.service';

@Controller('hr-dashboard')
export class HrDashboardController {
  constructor(private readonly service: HrDashboardService) {}

  @Get('summary')
  async getSummary() {
    return this.service.getDashboardSummary();
  }

  @Get('recent-leaves')
  async getRecentLeaves() {
    return this.service.getRecentLeaveRequests();
  }
}
