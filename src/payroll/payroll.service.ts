import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async getEmployeePayroll(employeeId: string) {
    return this.prisma.payroll.findMany({
      where: { employeeId },
      orderBy: { year: 'desc', month: 'desc' },
    });
  }

  async createPayroll(data: {
    employeeId: string;
    month: number;
    year: number;
    basicSalary: number;
    bonuses?: number;
    deductions?: number;
  }) {
    const netSalary = (data.basicSalary + (data.bonuses || 0)) - (data.deductions || 0);
    return this.prisma.payroll.create({
      data: {
        ...data,
        netSalary,
        status: 'PAID',
        paymentDate: new Date(),
      },
    });
  }
}
