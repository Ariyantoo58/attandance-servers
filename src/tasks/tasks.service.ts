import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createTask(data: {
    employeeIds: string[];
    title: string;
    description?: string;
    date?: string;
    dueDate?: string;
    priority?: string;
    category?: string;
  }) {
    const tasks = data.employeeIds.map((id) => ({
      employeeId: id,
      title: data.title,
      description: data.description,
      date: data.date ? new Date(data.date) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: 'PENDING',
      priority: data.priority || 'MEDIUM',
      progress: 0,
      category: data.category || 'GENERAL',
    }));

    const result = await this.prisma.task.createMany({
      data: tasks,
    });

    // Broadcast the new tasks. Since createMany doesn't return the objects, 
    // we notify that tasks were created for specific employees.
    this.notificationService.broadcast('task:created', { employeeIds: data.employeeIds, title: data.title });

    return result;
  }

  async getTasksByEmployee(employeeId: string) {
    return this.prisma.task.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
    });
  }

  async getAllTasks(query?: any) {
    const where: any = {};
    if (query?.employeeId) where.employeeId = query.employeeId;
    if (query?.status && query.status !== 'All') where.status = query.status;
    if (query?.priority) where.priority = query.priority;
    if (query?.category) where.category = query.category;
    
    if (query?.startDate || query?.endDate) {
      where.date = {};
      if (query?.startDate) where.date.gte = new Date(query.startDate);
      if (query?.endDate) where.date.lte = new Date(query.endDate);
    }

    return this.prisma.task.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTaskStatus(id: string, status: string) {
    const data: any = { status };
    if (status === 'COMPLETE') {
      data.progress = 100;
    }
    const updated = await this.prisma.task.update({
      where: { id },
      data,
    });
    this.notificationService.broadcast('task:updated', updated);
    return updated;
  }

  async updateTaskProgress(id: string, progress: number) {
    const data: any = { progress };
    if (progress === 100) {
      data.status = 'COMPLETE';
    } else if (progress > 0) {
      data.status = 'IN_PROGRESS';
    }
    const updated = await this.prisma.task.update({
      where: { id },
      data,
    });
    this.notificationService.broadcast('task:updated', updated);
    return updated;
  }

  async updateTask(id: string, data: any) {
    if (data.date) data.date = new Date(data.date);
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    
    const updated = await this.prisma.task.update({
      where: { id },
      data,
    });
    this.notificationService.broadcast('task:updated', updated);
    return updated;
  }
}
