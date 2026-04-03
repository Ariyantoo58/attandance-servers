import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimeOffService {
  constructor(private prisma: PrismaService) {}

  async createRequest(data: {
    employeeId: string;
    title: string;
    description?: string;
    fromdate: string;
    todate: string;
    type?: string;
  }) {
    return this.prisma.timeOff.create({
      data: {
        employeeId: data.employeeId,
        title: data.title,
        description: data.description,
        fromdate: new Date(data.fromdate),
        todate: new Date(data.todate),
        type: data.type || 'ANNUAL',
        status: 'SUBMITTED',
      },
    });
  }

  async getRequestsByEmployee(employeeId: string) {
    return this.prisma.timeOff.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllRequests() {
    return this.prisma.timeOff.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string, approvedBy?: string) {
    return this.prisma.timeOff.update({
      where: { id },
      data: { status, approvedBy },
    });
  }
}
