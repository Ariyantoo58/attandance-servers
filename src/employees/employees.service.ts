import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async findAll() {
    return this.prisma.employee.findMany({
        include: { department: true, position: true, user: { select: { role: true } } }
    });
  }

  async findAllDepartments() {
    return this.prisma.department.findMany();
  }

  async findAllPositions() {
    return this.prisma.position.findMany();
  }

  async findOne(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { department: true, position: true, user: { select: { role: true } } }
    });
  }

  async create(data: any) {
    try {
      const { username, password, email, role, ...employeeData } = data;
      
      const createPayload: any = { ...employeeData };
      delete createPayload.role; // Safeguard: Prisma doesn't like unexpected fields
      
      // If credentials are provided, create a linked User
      if (username && password) {
        createPayload.user = {
          create: {
            username,
            password,
            email: email || `${username}@company.com`,
            role: role || 'EMPLOYEE',
          }
        };
      }

      const employee = await this.prisma.employee.create({
        data: createPayload,
      });

      this.notificationService.broadcast('employee_changed', { action: 'CREATED', employee });
      return employee;
    } catch (error) {
      console.error('Prisma Employee Create Error:', error);
      throw error;
    }
  }

  async update(id: string, data: any) {
    const employee = await this.prisma.employee.update({
      where: { id },
      data,
    });
    this.notificationService.broadcast('employee_changed', { action: 'UPDATED', employee });
    return employee;
  }

  async remove(id: string) {
    try {
      // Use transaction to ensure all related data is deleted
      return await this.prisma.$transaction(async (prisma) => {
        // 1. Delete Attendance Corrections
        await prisma.attendanceCorrection.deleteMany({ where: { employeeId: id } });

        // 2. Delete Payrolls
        await prisma.payroll.deleteMany({ where: { employeeId: id } });

        // 3. Delete Notifications
        await prisma.notification.deleteMany({ where: { employeeId: id } });

        // 4. Delete Tasks
        await prisma.task.deleteMany({ where: { employeeId: id } });

        // 5. Delete TimeOffs
        await prisma.timeOff.deleteMany({ where: { employeeId: id } });

        // 6. Delete FaceMetadata
        await prisma.faceMetadata.deleteMany({ where: { employeeId: id } });

        // 7. Delete Attendance Records
        await prisma.attendance.deleteMany({ where: { employeeId: id } });

        // 8. Delete User account linked to employee
        await prisma.user.deleteMany({ where: { employeeId: id } });

        // 9. Finally delete the Employee
        const employee = await prisma.employee.delete({
          where: { id },
        });

        this.notificationService.broadcast('employee_changed', { action: 'DELETED', employeeId: id });
        return employee;
      });
    } catch (error) {
      console.error('Prisma Employee Delete Error:', error);
      throw error;
    }
  }
}
