import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FaceRecognitionModule } from './face-recognition/face-recognition.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { PrismaModule } from './prisma/prisma.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TimeOffModule } from './time-off/time-off.module';
import { TaskModule } from './tasks/tasks.module';
import { PayrollModule } from './payroll/payroll.module';
import { NotificationModule } from './notifications/notifications.module';
import { HrDashboardModule } from './hr-dashboard/hr-dashboard.module';

import { AttendanceCorrectionModule } from './attendance-correction/attendance-correction.module';
import { TeamsModule } from './teams/teams.module';
import { OvertimeModule } from './overtime/overtime.module';
import { KpiModule } from './kpi/kpi.module';
import { ReimbursementModule } from './reimbursement/reimbursement.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    PrismaModule,

    FaceRecognitionModule,
    AuthModule,
    EmployeesModule,
    AttendanceModule,
    TimeOffModule,
    TaskModule,
    PayrollModule,
    NotificationModule,
    HrDashboardModule,
    AttendanceCorrectionModule,
    TeamsModule,
    OvertimeModule,
    KpiModule,
    ReimbursementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
