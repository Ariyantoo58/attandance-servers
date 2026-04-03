import { Injectable, OnModuleInit } from '@nestjs/common';
import * as ms from '@nestjs/microservices';
import { join } from 'path';
import { Observable, lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export interface RegisterRequest {
  id: string;
  imageData: Buffer;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface RecognizeRequest {
  imageData: Buffer;
}

export interface RecognizeResponse {
  recognized: boolean;
  id: string;
  confidence: number;
  message: string;
}

interface FaceRecognitionGrpcService {
  registerFace(data: RegisterRequest): Observable<RegisterResponse>;
  recognizeFace(data: RecognizeRequest): Observable<RecognizeResponse>;
  deleteFace(data: { id: string }): Observable<{ success: boolean; message: string }>;
  getFaceStatus(data: { id: string }): Observable<{ registered: boolean; message: string }>;
}

@Injectable()
export class FaceRecognitionService implements OnModuleInit {
  @ms.Client({
    transport: ms.Transport.GRPC,
    options: {
      package: 'face_recognition',
      protoPath: join(process.cwd(), 'proto/face_recognition.proto'),
      url: 'localhost:50051',
    },
  })
  private client: ms.ClientGrpc;

  private grpcService: FaceRecognitionGrpcService;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.grpcService = this.client.getService<FaceRecognitionGrpcService>(
      'FaceRecognitionService',
    );
  }

  async register(employeeId: string, imageBuffer: Buffer) {
    // 1. Call Python gRPC API using employeeId as the unique ID (UUID)
    const response = await lastValueFrom(
      this.grpcService.registerFace({
        id: employeeId,
        imageData: imageBuffer,
      }),
    );

    if (!response) {
      return { success: false, message: 'No response from gRPC service' };
    }

    // 2. If success, ensure employee exists or update it (optional update)
    if (response.success) {
      const exists = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });
      if (exists) {
        await this.prisma.employee.update({
          where: { id: employeeId },
          data: { updatedAt: new Date() },
        });
      }
    }

    return response;
  }

  async recognize(imageBuffer: Buffer) {
    // 1. Call Python gRPC API
    const response = await lastValueFrom(
      this.grpcService.recognizeFace({ imageData: imageBuffer }),
    );

    if (!response) {
      return {
        recognized: false,
        message: 'No response from gRPC service',
        name: 'Unknown',
        confidence: 0,
      };
    }

    // 2. If recognized, resolve name from database using the UUID returned
    if (response.recognized && response.id !== 'Unknown') {
      const employeeId = response.id;
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (employee) {
        // Log attendance
        await this.prisma.attendance.create({
          data: {
            employeeId: employee.id,
            status: 'present',
          },
        });

        // Return original response but with the real name from DB
        return {
          ...response,
          name: employee.name, // Inject name from DB
        };
      }
    }

    return {
      ...response,
      name: 'Unknown',
    };
  }
  
  async checkStatus(employeeId: string) {
    console.log(`[FaceRecognitionService] Checking status for: ${employeeId}`);
    try {
      const response = await lastValueFrom(
        this.grpcService.getFaceStatus({ id: employeeId }),
      );
      console.log(`[FaceRecognitionService] Status result:`, response);
      return response;
    } catch (e) {
      console.error(`[FaceRecognitionService] Error:`, e);
      return { registered: false, message: 'gRPC error' };
    }
  }

  async delete(employeeId: string) {
    try {
      const response = await lastValueFrom(
        this.grpcService.deleteFace({ id: employeeId }),
      );
      return response;
    } catch (e) {
      return { success: false, message: 'gRPC error' };
    }
  }
}
