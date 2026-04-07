import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrDashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    const today = new Date();
    today.setHours(0,0,0,0);

    const [
      employeeCount,
      pendingLeaves,
      todayAttendance,
      activeTasks,
      teamCount,
      pendingPayroll,
      pendingCorrections,
      pendingOvertime
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.timeOff.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.attendance.count({ where: { date: today } }),
      this.prisma.task.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      this.prisma.team.count(),
      this.prisma.payroll.count({ where: { status: 'PENDING' } }),
      this.prisma.attendanceCorrection.count({ where: { status: 'PENDING' } }),
      this.prisma.overtime.count({ where: { status: 'PENDING' } })
    ]);

    return {
      employeeCount,
      pendingLeaves,
      todayAttendance,
      activeTasks,
      teamCount,
      pendingPayroll,
      pendingCorrections,
      pendingOvertime
    };
  }

  async getRecentLeaveRequests() {
    return this.prisma.timeOff.findMany({
      where: { status: 'SUBMITTED' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { employee: true }
    });
  }
}
