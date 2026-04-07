import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class OvertimeService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async requestOvertime(employeeId: string, data: {
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }) {
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    const overtime = await this.prisma.overtime.create({
      data: {
        employeeId,
        date,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        reason: data.reason,
        status: 'PENDING',
      },
      include: { employee: true },
    });

    // Notify HR
    this.notificationService.notifyHR(
      'Pengajuan Lembur Baru',
      `${overtime.employee.name} mengajukan lembur untuk tanggal ${date.toLocaleDateString()}.`,
    );

    this.notificationService.broadcast('overtime:requested', overtime);

    return overtime;
  }

  async approveOvertime(id: string, status: string, adminNote?: string) {
    const overtime = await this.prisma.overtime.findUnique({
      where: { id },
      include: { employee: { include: { user: true } } },
    });

    if (!overtime) {
      throw new NotFoundException('Overtime request not found');
    }

    const updated = await this.prisma.overtime.update({
      where: { id },
      data: {
        status,
        adminNote,
      },
    });

    if (overtime.employee.user) {
      this.notificationService.notifyUser(
        overtime.employee.user.id,
        `Pengajuan Lembur ${status}`,
        `Pengajuan lembur Anda untuk ${overtime.date.toLocaleDateString()} telah ${status.toLowerCase()}.`,
        { status }
      );
    }

    this.notificationService.broadcast('overtime:updated', updated);

    return updated;
  }

  async getMyOvertime(employeeId: string) {
    return this.prisma.overtime.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
    });
  }

  async getAllPendingOvertime() {
    return this.prisma.overtime.findMany({
      where: { status: 'PENDING' },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOvertimeByDateAndEmployee(employeeId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    return this.prisma.overtime.findFirst({
      where: {
        employeeId,
        date: startOfDay,
        status: 'APPROVED',
      },
    });
  }

  async recordClockIn(overtimeId: string) {
    return this.prisma.overtime.update({
      where: { id: overtimeId },
      data: { actualStart: new Date() },
    });
  }

  async recordClockOut(overtimeId: string) {
    const overtime = await this.prisma.overtime.findUnique({
      where: { id: overtimeId },
      include: { employee: true },
    });

    if (!overtime || !overtime.actualStart) return null;

    const actualEnd = new Date();
    const diffMs = actualEnd.getTime() - overtime.actualStart.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    
    if (hours <= 0) {
       return this.prisma.overtime.update({
         where: { id: overtimeId },
         data: { actualEnd, status: 'COMPLETED', duration: 0, compensation: 0 }
       });
    }

    // Calculation: (Salary / 173) * Multiplier
    const baseSalary = overtime.employee.salary || 0;
    const hourlyRate = baseSalary / 173;
    
    let multiplier = 0;
    if (hours <= 1) {
      multiplier = hours * 1.5;
    } else {
      multiplier = 1.5 + (hours - 1) * 2;
    }

    const compensation = multiplier * hourlyRate;

    return this.prisma.overtime.update({
      where: { id: overtimeId },
      data: {
        actualEnd,
        duration: hours,
        compensation: compensation,
        status: 'COMPLETED',
      },
    });
  }
}
