import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { KpiService } from './kpi.service';

@Controller('kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get('summary')
  async getSummary(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.kpiService.getAllKpiSummaries(parseInt(month), parseInt(year));
  }

  @Get('employee/:id')
  async getEmployeeKpi(
    @Param('id') id: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.kpiService.calculateMonthlyKpi(id, parseInt(month), parseInt(year));
  }

  @Get('history/:id')
  async getHistory(@Param('id') id: string) {
    return this.kpiService.getEmployeePerformanceHistory(id);
  }

  @Post('review')
  async submitReview(@Body() data: any) {
    return this.kpiService.upsertReview(data);
  }

  @Get('criteria')
  async getCriteria() {
    return this.kpiService.getGlobalCriteria();
  }

  @Post('criteria')
  async addCriteria(@Body('name') name: string) {
    return this.kpiService.addGlobalCriteria(name);
  }

  @Post('delete-criteria/:id') // Use Post or Delete, standardizing on Post for simple proxying if needed, but Delete is better for REST
  async deleteCriteria(@Param('id') id: string) {
    return this.kpiService.deleteGlobalCriteria(id);
  }
}
