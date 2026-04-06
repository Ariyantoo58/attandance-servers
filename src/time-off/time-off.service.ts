import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class TimeOffService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createRequest(data: {
    employeeId: string;
    title: string;
    description?: string;
    fromdate: string;
    todate: string;
    type?: string;
  }) {
    const request = await this.prisma.timeOff.create({
      data: {
        employeeId: data.employeeId,
        title: data.title,
        description: data.description,
        fromdate: new Date(data.fromdate),
        todate: new Date(data.todate),
        type: data.type || 'ANNUAL',
        status: 'SUBMITTED',
      },
      include: { employee: true },
    });

    // Notify HR via notification
    this.notificationService.notifyHR(
      'New Time Off Request',
      `${request.employee.name} has submitted a new request: ${request.title}`,
      { requestId: request.id },
    );

    // Broadcast for live list update
    this.notificationService.broadcast('time_off:requested', request);

    return request;
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

  async updateStatus(id: string, status: string, approvedByEmployeeId: string, role: string) {
    const request = await this.prisma.timeOff.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!request) {
      throw new NotFoundException('Time off request not found');
    }

    const isHR = ['HR', 'ADMIN', 'MANAGER'].includes(role);

    if (!isHR) {
      // Check if the approver is a leader of a team containing the requester
      const teamLeadCheck = await this.prisma.team.findFirst({
        where: {
          leaderId: approvedByEmployeeId,
          members: {
            some: {
              employeeId: request.employeeId
            }
          }
        }
      });

      if (!teamLeadCheck) {
        throw new ForbiddenException('You do not have permission to process this request');
      }
    }

    const updated = await this.prisma.timeOff.update({
      where: { id },
      data: { status, approvedBy: approvedByEmployeeId },
      include: { employee: true },
    });

    // Notify Employee
    const user = await this.prisma.user.findUnique({ where: { employeeId: updated.employeeId } });
    if (user) {
      this.notificationService.notifyUser(
        user.id,
        `Time Off ${status}`,
        `Your request "${updated.title}" has been ${status.toLowerCase()}.`,
        { requestId: updated.id, status },
      );
    }

    // Broadcast change for all relevant views
    this.notificationService.broadcast('time_off:changed', updated);

    return updated;
  }
}
