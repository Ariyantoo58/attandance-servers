import { Module } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { NotificationController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SocketGateway } from './socket.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: 'secretKey', // In production use environment variable
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, SocketGateway],
  exports: [NotificationService],
})
export class NotificationModule {}
