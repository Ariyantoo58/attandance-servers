import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async clockIn(employeeId: string, location?: string, deviceInfo?: string, latitude?: number, longitude?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance already exists for today
    const existingEntry = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (existingEntry) {
      throw new BadRequestException('Already clocked in for today');
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        clockIn: new Date(),
        clockInLocation: location,
        clockInLat: latitude,
        clockInLng: longitude,
        deviceInfo,
        status: 'PRESENT',
      },
      include: { employee: true },
    });

    // Notify user and broadcast update
    const user = await this.prisma.user.findUnique({ where: { employeeId } });
    if (user) {
      this.notificationService.notifyUser(user.id, 'Clock In Successful', `You clocked in at ${new Date().toLocaleTimeString()}`);
    }
    this.notificationService.broadcast('attendance_updated', attendance);

    return attendance;
  }

  async clockOut(employeeId: string, latitude?: number, longitude?: number, location?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (!attendance) {
      throw new BadRequestException('Not clocked in for today');
    }

    if (attendance.clockOut) {
      throw new BadRequestException('Already clocked out for today');
    }

    const updated = await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: new Date(),
        clockOutLat: latitude, 
        clockOutLng: longitude,
        clockOutLocation: location,
      },
      include: { employee: true },
    });

    // Notify user and broadcast update
    const user = await this.prisma.user.findUnique({ where: { employeeId } });
    if (user) {
      this.notificationService.notifyUser(user.id, 'Clock Out Successful', `You clocked out at ${new Date().toLocaleTimeString()}`);
    }
    this.notificationService.broadcast('attendance_updated', updated);

    return updated;
  }

  async getAttendanceHistory(employeeId: string, skip?: number, take?: number) {
    return this.prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
      skip: skip || 0,
      take: take || undefined,
    });
  }

  async getAttendanceByMonth(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }


  async getDailyAttendance(date: Date) {
     const startOfDay = new Date(date);
     startOfDay.setHours(0, 0, 0, 0);
     return this.prisma.attendance.findMany({
       where: { date: startOfDay },
       include: { employee: true },
     });
  }
}
