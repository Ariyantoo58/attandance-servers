import { Module } from '@nestjs/common';
import { FaceRecognitionService } from './face-recognition.service';
import { FaceRecognitionController } from './face-recognition.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [AttendanceModule],
  controllers: [FaceRecognitionController],
  providers: [FaceRecognitionService, PrismaService],
})
export class FaceRecognitionModule {}
