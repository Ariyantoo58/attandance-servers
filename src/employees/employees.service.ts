import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.employee.findMany({
        include: { department: true, position: true }
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

      return await this.prisma.employee.create({
        data: createPayload,
      });
    } catch (error) {
      console.error('Prisma Employee Create Error:', error);
      throw error;
    }
  }

  async update(id: string, data: any) {
    return this.prisma.employee.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.employee.delete({
      where: { id },
    });
  }
}
