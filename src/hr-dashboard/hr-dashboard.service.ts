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

  async getAnalyticsData() {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    // 1. KPI Distribution
    const reviews = await this.prisma.kpiReview.findMany({
      where: { 
        month: today.getMonth() + 1,
        year: today.getFullYear()
      }
    });

    const kpiDistribution = {
      excellent: reviews.filter(r => r.overallScore >= 85).length,
      good: reviews.filter(r => r.overallScore >= 70 && r.overallScore < 85).length,
      fair: reviews.filter(r => r.overallScore >= 50 && r.overallScore < 70).length,
      poor: reviews.filter(r => r.overallScore < 50).length,
      total: reviews.length
    };

    // 2. Attendance Trends (Last 7 Days)
    const attendanceHistory = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0,0,0,0);
      
      const count = await this.prisma.attendance.count({
        where: { date: d }
      });
      
      attendanceHistory.push({
        date: d.toISOString().split('T')[0],
        count
      });
    }

    // 3. Departmental Stats
    const allDepts = await this.prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    const deptStats = await Promise.all(
      allDepts.map(async (dept) => {
        const employeesInDept = await this.prisma.employee.findMany({
          where: { departmentId: dept.id },
          select: { id: true },
        });
        const empIds = employeesInDept.map((e) => e.id);

        let avgScore = 0;
        if (empIds.length > 0) {
          const kpiAvg = await this.prisma.kpiReview.aggregate({
            where: {
              employeeId: { in: empIds },
              month: today.getMonth() + 1,
              year: today.getFullYear(),
            },
            _avg: { overallScore: true },
          });
          avgScore = kpiAvg._avg.overallScore || 0;
        }

        return {
          name: dept.name,
          count: dept._count.employees,
          avgScore: avgScore,
        };
      }),
    );

    // 4. Top Performers
    const topPerformers = await this.prisma.kpiReview.findMany({
      where: {
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        status: 'FINAL',
      },
      orderBy: { overallScore: 'desc' },
      take: 5,
      include: {
        employee: {
          select: { name: true, avatarUrl: true, designation: true },
        },
      },
    });

    // 5. Task Overview
    const [completedTasks, totalTasks] = await Promise.all([
      this.prisma.task.count({ where: { status: 'COMPLETE' } }),
      this.prisma.task.count(),
    ]);

    return {
      kpiDistribution,
      attendanceHistory,
      deptStats,
      topPerformers: topPerformers.map((p) => ({
        id: p.id,
        name: p.employee.name,
        avatar: p.employee.avatarUrl,
        designation: p.employee.designation,
        score: p.overallScore,
      })),
      tasks: {
        completed: completedTasks,
        pending: totalTasks - completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
    };
  }
}
