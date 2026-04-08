import { Injectable, OnModuleInit } from '@nestjs/common';
import * as ms from '@nestjs/microservices';
import { join } from 'path';
import { Observable, lastValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { OvertimeService } from '../overtime/overtime.service';

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
      url: '127.0.0.1:50051',
    },
  })
  private client: ms.ClientGrpc;

  private grpcService: FaceRecognitionGrpcService;

  constructor(
    private prisma: PrismaService,
    private attendanceService: AttendanceService,
    private overtimeService: OvertimeService,
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

  async recognize(imageBuffer: Buffer, expectedEmployeeId?: string, latitude?: number, longitude?: number) {
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
          message: 'Gagal: Wajah yang terdeteksi tidak sesuai dengan akun yang login.',
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

        try {
          if (!existingAttendance) {
            const locName = latitude && longitude ? 'Mobile (Face Scan)' : 'Office (Face Scan)';
            await this.attendanceService.clockIn(employee.id, locName, 'Mobile Device', latitude, longitude);
            return {
              recognized: true,
              id: employee.id,
              name: employee.name,
              confidence: response.confidence,
              message: 'Clock In Berhasil',
            };
          } else if (!existingAttendance.clockOut) {
            const locName = latitude && longitude ? 'Mobile (Face Scan)' : 'Office (Face Scan)';
            await this.attendanceService.clockOut(employee.id, latitude, longitude, locName);
            return {
              recognized: true,
              id: employee.id,
              name: employee.name,
              confidence: response.confidence,
              message: 'Clock Out Berhasil',
            };
          } else {
            // Check for approved overtime if regular clock-out is done
            const approvedOvertime = await this.overtimeService.getOvertimeByDateAndEmployee(employee.id, today);
            
            if (approvedOvertime) {
              if (!approvedOvertime.actualStart) {
                await this.overtimeService.recordClockIn(approvedOvertime.id);
                return {
                  recognized: true,
                  id: employee.id,
                  name: employee.name,
                  confidence: response.confidence,
                  message: 'Clock In Lembur Berhasil',
                };
              } else if (!approvedOvertime.actualEnd) {
                const updatedOvertime = await this.overtimeService.recordClockOut(approvedOvertime.id);
                return {
                  recognized: true,
                  id: employee.id,
                  name: employee.name,
                  confidence: response.confidence,
                  message: 'Clock Out Lembur Berhasil',
                  overtime_duration: updatedOvertime?.duration,
                  overtime_pay: updatedOvertime?.compensation
                };
              }
            }

            return {
              recognized: false,
              id: employee.id,
              name: employee.name,
              confidence: response.confidence,
              message: 'Anda sudah melakukan Clock In & Clock Out hari ini.',
            };
          }
        } catch (error) {
           console.error('[FaceRecognitionService] Attendance recording failed:', error);
           return {
             recognized: false,
             id: employee.id,
             name: employee.name,
             confidence: response.confidence,
             message: error.response?.message || error.message || 'Gagal mencatat absensi.',
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

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
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
