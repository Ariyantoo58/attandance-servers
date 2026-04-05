import { Module } from '@nestjs/common';
import { AttendanceCorrectionService } from './attendance-correction.service';
import { AttendanceCorrectionController } from './attendance-correction.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AttendanceCorrectionService],
  controllers: [AttendanceCorrectionController],
  exports: [AttendanceCorrectionService],
})
export class AttendanceCorrectionModule {}
