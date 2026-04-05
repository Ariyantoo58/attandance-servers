import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('SocketGateway');

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('Socket Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        this.logger.warn(`Client disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, { secret: 'secretKey' }); // Use same secret as JwtStrategy
      client.data.user = payload;
      
      // Join a private room for the user
      client.join(`user_${payload.userId}`);
      
      // Join a room for their role (e.g., room:hr)
      if (payload.role === 'HR' || payload.role === 'ADMIN') {
        client.join('room:hr');
      }

      this.logger.log(`Client connected: ${payload.username} (${client.id})`);
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Helper method to emit to a specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  // Helper method to emit to all HRs
  sendToHR(event: string, data: any) {
    this.server.to('room:hr').emit(event, data);
  }

  // Helper method to broadcast
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }
}
