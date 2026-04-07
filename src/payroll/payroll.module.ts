import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notifications.module';
import { OvertimeModule } from '../overtime/overtime.module';

@Module({
  imports: [PrismaModule, NotificationModule, OvertimeModule],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}

