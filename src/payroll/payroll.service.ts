import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async getEmployeePayroll(employeeId: string) {
    return this.prisma.payroll.findMany({
      where: { employeeId },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });
  }

  async getMonthlyPayrolls(month: number, year: number) {
    return this.prisma.payroll.findMany({
      where: { month, year },
    });
  }

  async createPayroll(data: {
    employeeId: string;
    month: number;
    year: number;
    basicSalary: number;
    overtime?: number;
    bonuses?: number;
    pph21?: number;
    bpjsKetenagakerjaan?: number;
    bpjsKesehatan?: number;
    lateDeduction?: number;
    otherDeductions?: number;
  }) {
    // 1. Fetch all COMPLETED overtimes for this employee in this month/year
    const startDate = new Date(data.year, data.month - 1, 1);
    const endDate = new Date(data.year, data.month, 0, 23, 59, 59);

    const overtimes = await this.prisma.overtime.findMany({
      where: {
        employeeId: data.employeeId,
        status: 'COMPLETED',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const calculatedOvertime = overtimes.reduce((sum, ot) => sum + ot.compensation, 0);
    const finalOvertime = data.overtime !== undefined ? data.overtime : calculatedOvertime;

    const earnings = (data.basicSalary || 0) + (finalOvertime || 0) + (data.bonuses || 0);
    const deductions = (data.pph21 || 0) + (data.bpjsKetenagakerjaan || 0) + (data.bpjsKesehatan || 0) + (data.lateDeduction || 0) + (data.otherDeductions || 0);
    const netSalary = earnings - deductions;

    const payroll = await this.prisma.payroll.upsert({
      where: {
        employeeId_month_year: {
          employeeId: data.employeeId,
          month: data.month,
          year: data.year,
        },
      },
      update: {
        ...data,
        overtime: finalOvertime,
        netSalary,
        status: 'PAID',
        paymentDate: new Date(),
      },
      create: {
        ...data,
        overtime: finalOvertime,
        netSalary,
        status: 'PAID',
        paymentDate: new Date(),
      },
      include: { employee: { include: { user: true } } },
    });

    // Notify Employee via Push & Real-time
    if (payroll.employee.user) {
        this.notificationService.notifyUser(
            payroll.employee.user.id,
            'Gaji Telah Dibayarkan',
            `Slip gaji Anda untuk periode ${data.month}/${data.year} sudah tersedia.`,
            { month: data.month, year: data.year }
        );
    }

    // Broadcast for HR real-time refresh
    this.notificationService.broadcast('payroll_changed', payroll);

    return payroll;
  }
}
