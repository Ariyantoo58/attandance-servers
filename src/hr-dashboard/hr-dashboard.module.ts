import { Module } from '@nestjs/common';
import { HrDashboardController } from './hr-dashboard.controller';
import { HrDashboardService } from './hr-dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [HrDashboardController],
  providers: [HrDashboardService, PrismaService],
})
export class HrDashboardModule {}
