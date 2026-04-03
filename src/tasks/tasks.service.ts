import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async createTask(data: {
    employeeId: string;
    title: string;
    description?: string;
    date?: string;
    priority?: string;
  }) {
    return this.prisma.task.create({
      data: {
        employeeId: data.employeeId,
        title: data.title,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        status: 'PENDING',
        priority: data.priority || 'MEDIUM',
      },
    });
  }

  async getTasksByEmployee(employeeId: string) {
    return this.prisma.task.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
    });
  }

  async getAllTasks() {
    return this.prisma.task.findMany({
      include: { employee: true },
      orderBy: { date: 'desc' },
    });
  }

  async updateTaskStatus(id: string, status: string) {
    return this.prisma.task.update({
      where: { id },
      data: { status },
    });
  }
}
