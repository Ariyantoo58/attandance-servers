import { Injectable, OnModuleInit } from '@nestjs/common';
import * as ms from '@nestjs/microservices';
import { join } from 'path';
import { Observable, lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export interface RegisterRequest {
  name: string;
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
  name: string;
  confidence: number;
  message: string;
}

interface FaceRecognitionGrpcService {
  registerFace(data: RegisterRequest): Observable<RegisterResponse>;
  recognizeFace(data: RecognizeRequest): Observable<RecognizeResponse>;
}

@Injectable()
export class FaceRecognitionService implements OnModuleInit {
  @ms.Client({
    transport: ms.Transport.GRPC,
    options: {
      package: 'face_recognition',
      protoPath: join(__dirname, '../../proto/face_recognition.proto'),
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

  async register(name: string, imageBuffer: Buffer) {
    // 1. Call Python gRPC API
    const response = await lastValueFrom(
      this.grpcService.registerFace({ name, imageData: imageBuffer }),
    );

    if (!response) {
      return { success: false, message: 'No response from gRPC service' };
    }

    // 2. If success, save to database
    if (response.success) {
      await this.prisma.employee.upsert({
        where: { name },
        update: { updatedAt: new Date() },
        create: { name, role: 'Employee' },
      });
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

    // 2. If recognized, log attendance
    if (response.recognized) {
      const employee = await this.prisma.employee.findUnique({
        where: { name: response.name },
      });

      if (employee) {
        await this.prisma.attendance.create({
          data: {
            employeeId: employee.id,
            status: 'present',
          },
        });
      }
    }

    return response;
  }
}
