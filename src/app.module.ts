import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FaceRecognitionModule } from './face-recognition/face-recognition.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, FaceRecognitionModule, AuthModule, EmployeesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
