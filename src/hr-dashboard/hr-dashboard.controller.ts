import { Controller, Get } from '@nestjs/common';
import { HrDashboardService } from './hr-dashboard.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('hr-dashboard')
@Controller('hr-dashboard')
export class HrDashboardController {
  constructor(private readonly service: HrDashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary stats' })
  @ApiResponse({ status: 200, description: 'Return counts and stats.' })
  async getSummary() {
    return this.service.getDashboardSummary();
  }

  @Get('recent-leaves')
  @ApiOperation({ summary: 'Get recent leave requests' })
  @ApiResponse({ status: 200, description: 'Return latest time off requests.' })
  async getRecentLeaves() {
    return this.service.getRecentLeaveRequests();
  }
}

