import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in meters
  }

  async clockIn(employeeId: string, location?: string, deviceInfo?: string, latitude?: number, longitude?: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch employee and their assigned branch
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { branch: true }
    });

    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    // Geofencing Check
    console.log(`[AttendanceService] Checking geofence for employee: ${employee.name} (${employeeId})`);
    if (employee.branchId) {
      if (!latitude || !longitude) {
        console.warn(`[AttendanceService] Employee has branch ${employee.branchId} but no coordinates provided.`);
        throw new BadRequestException('Lokasi GPS tidak terdeteksi. Silakan aktifkan GPS Anda.');
      }

      const distance = this.getDistance(
        latitude,
        longitude,
        employee.branch.latitude,
        employee.branch.longitude
      );

      console.log(`[AttendanceService] Distance: ${Math.round(distance)}m, Radius: ${employee.branch.radius}m`);

      if (distance > employee.branch.radius) {
        console.warn(`[AttendanceService] Geofence violation: ${Math.round(distance)}m > ${employee.branch.radius}m`);
        throw new BadRequestException(`Absensi Gagal: Anda berada di luar jangkauan (${Math.round(distance)}m). Batas: ${employee.branch.radius}m.`);
      }
    }

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

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { branch: true }
    });

    console.log(`[AttendanceService] Checking geofence for clock-out: ${employee?.name} (${employeeId})`);
    if (employee?.branchId) {
      if (!latitude || !longitude) {
        console.warn(`[AttendanceService] Employee has branch ${employee.branchId} but no coordinates for clock-out.`);
        throw new BadRequestException('Lokasi GPS tidak terdeteksi untuk Clock Out.');
      }

      const distance = this.getDistance(
        latitude,
        longitude,
        employee.branch.latitude,
        employee.branch.longitude
      );

      console.log(`[AttendanceService] Clock Out Distance: ${Math.round(distance)}m, Radius: ${employee.branch.radius}m`);

      if (distance > employee.branch.radius) {
        console.warn(`[AttendanceService] Geofence violation (Out): ${Math.round(distance)}m > ${employee.branch.radius}m`);
        throw new BadRequestException(`Absensi Gagal: Anda berada di luar jangkauan untuk Clock Out (${Math.round(distance)}m).`);
      }
    }

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
