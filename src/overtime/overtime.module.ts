import { Module } from '@nestjs/common';
import { OvertimeService } from './overtime.service';
import { OvertimeController } from './overtime.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  providers: [OvertimeService],
  controllers: [OvertimeController],
  exports: [OvertimeService],
})
export class OvertimeModule {}
