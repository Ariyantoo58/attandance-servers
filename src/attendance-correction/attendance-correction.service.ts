import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceCorrectionService {
  constructor(private prisma: PrismaService) {}

  async requestCorrection(employeeId: string, data: {
    requestedDate: string;
    requestedClockIn?: string;
    requestedClockOut?: string;
    reason: string;
  }) {
    const date = new Date(data.requestedDate);
    date.setHours(0, 0, 0, 0);

    // Find existing attendance for snapshot
    const existingAttendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date,
        },
      },
    });

    return this.prisma.attendanceCorrection.create({
      data: {
        employeeId,
        attendanceId: existingAttendance?.id || null,
        oldClockIn: existingAttendance?.clockIn || null,
        oldClockOut: existingAttendance?.clockOut || null,
        requestedDate: date,
        requestedClockIn: data.requestedClockIn ? new Date(data.requestedClockIn) : null,
        requestedClockOut: data.requestedClockOut ? new Date(data.requestedClockOut) : null,
        reason: data.reason,
        status: 'PENDING',
      },
    });
  }

  async getMyCorrections(employeeId: string) {
    return this.prisma.attendanceCorrection.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      include: { attendance: true },
    });
  }

  async getAllPendingCorrections() {
    return this.prisma.attendanceCorrection.findMany({
      where: { status: 'PENDING' },
      include: { employee: true, attendance: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string, adminNote?: string) {
    const correction = await this.prisma.attendanceCorrection.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!correction) {
      throw new NotFoundException('Correction request not found');
    }

    if (correction.status !== 'PENDING') {
      throw new BadRequestException('Request already processed');
    }

    if (status === 'APPROVED') {
      // Update or create attendance record
      const attendanceData = {
        clockIn: correction.requestedClockIn || undefined,
        clockOut: correction.requestedClockOut || undefined,
        status: 'PRESENT', // Assume corrected to present
      };

      if (correction.attendanceId) {
        // Update existing
        await this.prisma.attendance.update({
          where: { id: correction.attendanceId },
          data: {
            ...attendanceData,
            isCorrected: true,
          },
        });
      } else {
        // Create new
        await this.prisma.attendance.create({
          data: {
            employeeId: correction.employeeId,
            date: correction.requestedDate,
            clockIn: correction.requestedClockIn || new Date(),
            clockOut: correction.requestedClockOut,
            status: 'PRESENT',
            isCorrected: true,
          },
        });
      }
    }

    return this.prisma.attendanceCorrection.update({
      where: { id },
      data: {
        status,
        adminNote,
      },
    });
  }
}
