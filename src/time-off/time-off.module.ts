import { Module } from '@nestjs/common';
import { TimeOffService } from './time-off.service';
import { TimeOffController } from './time-off.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [TimeOffController],
  providers: [TimeOffService],
})
export class TimeOffModule {}
