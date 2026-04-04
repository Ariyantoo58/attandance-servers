import { Injectable, OnModuleInit } from '@nestjs/common';
import * as ms from '@nestjs/microservices';
import { join } from 'path';
import { Observable, lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';

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

  constructor(
    private prisma: PrismaService,
    private attendanceService: AttendanceService,
  ) {}

  onModuleInit() {
    this.grpcService = this.client.getService<FaceRecognitionGrpcService>(
      'FaceRecognitionService',
    );
  }

  async register(employeeId: string, imageBuffer: Buffer) {
    // 0. Check if this face already belongs to someone else
    try {
      const recognizeResponse = await lastValueFrom(
        this.grpcService.recognizeFace({ imageData: imageBuffer }),
      ).catch(() => null);

      if (recognizeResponse && recognizeResponse.recognized) {
        // If recognized and NOT the same employee
        if (recognizeResponse.id !== employeeId) {
          const existingEmployee = await this.prisma.employee.findUnique({
            where: { id: recognizeResponse.id },
          });
          const name = existingEmployee ? existingEmployee.name : 'karyawan lain';
          return {
            success: false,
            message: `Wajah ini sudah terdaftar atas nama ${name}. Satu wajah hanya dapat digunakan untuk satu data karyawan.`,
          };
        }
      }
    } catch (error) {
      console.error('[FaceRecognitionService] Error checking existing face:', error);
      // Continue registration if recognition service fails? 
      // Probably safer to continue if it's just a check, but ideally we'd want it to work.
    }

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

  async recognize(imageBuffer: Buffer, expectedEmployeeId?: string) {
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
  
    // 2. Resolve name from database using the UUID returned
    if (response.recognized && response.id !== 'Unknown') {
      const recognizedId = response.id;
      
      // Verification: If expectedEmployeeId is provided, it MUST match
      if (expectedEmployeeId && recognizedId !== expectedEmployeeId) {
        return {
          recognized: false,
          message: 'Face does not match the logged-in user',
          name: 'Unknown',
          confidence: response.confidence
        };
      }
  
      const employee = await this.prisma.employee.findUnique({
        where: { id: recognizedId },
      });
  
      if (employee) {
        // Attendance Logic: Clock In -> Clock Out -> No more
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingAttendance = await this.prisma.attendance.findUnique({
          where: {
            employeeId_date: {
              employeeId: employee.id,
              date: today,
            },
          },
        });

        if (!existingAttendance) {
          await this.attendanceService.clockIn(employee.id, 'Office (Face Scan)', 'Mobile Device');
          return {
            ...response,
            name: employee.name,
            message: 'Clock In Berhasil',
          };
        } else if (!existingAttendance.clockOut) {
          await this.attendanceService.clockOut(employee.id);
          return {
            ...response,
            name: employee.name,
            message: 'Clock Out Berhasil',
          };
        } else {
          return {
            recognized: false,
            id: employee.id,
            name: employee.name,
            confidence: response.confidence,
            message: 'Anda sudah melakukan Clock In & Clock Out hari ini.',
          };
        }
      }
    }
  
    return {
      ...response,
      name: 'Unknown',
      message: response.recognized ? 'Recognized but employee not found in database' : response.message
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
