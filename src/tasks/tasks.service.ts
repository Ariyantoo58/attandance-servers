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
    employeeIds?: string[];
    teamId?: string;
    title: string;
    description?: string;
    date?: string;
    dueDate?: string;
    priority?: string;
    category?: string;
  }) {
    if (data.teamId) {
      // Create a single task for the team
      const task = await this.prisma.task.create({
        data: {
          teamId: data.teamId,
          title: data.title,
          description: data.description,
          date: data.date ? new Date(data.date) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          status: 'PENDING',
          priority: data.priority || 'MEDIUM',
          progress: 0,
          category: data.category || 'GENERAL',
        },
      });

      // Broadcast and notify team members
      const teamMembers = await this.prisma.teamMember.findMany({
        where: { teamId: data.teamId },
        select: { employeeId: true },
      });
      const employeeIds = teamMembers.map((m) => m.employeeId);
      
      this.notificationService.broadcast('task:created', { 
        teamId: data.teamId, 
        employeeIds, 
        title: data.title 
      });

      return task;
    }

    const tasks = (data.employeeIds || []).map((id) => ({
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

    this.notificationService.broadcast('task:created', { 
      employeeIds: data.employeeIds, 
      title: data.title 
    });

    return result;
  }

  async getTasksByEmployee(employeeId: string) {
    // Find teams the employee belongs to
    const teams = await this.prisma.teamMember.findMany({
      where: { employeeId },
      select: { teamId: true },
    });
    const teamIds = teams.map((t) => t.teamId);

    return this.prisma.task.findMany({
      where: {
        OR: [
          { employeeId },
          { teamId: { in: teamIds } },
        ],
      },
      include: {
        team: true,
        employee: true,
      },
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
      include: { 
        employee: true,
        team: true,
      },
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
    
    // If switching to team, clear employeeId
    if (data.teamId) {
      data.employeeId = null;
    } 
    // If switching to individual, clear teamId
    else if (data.employeeId) {
      data.teamId = null;
    }
    
    const updated = await this.prisma.task.update({
      where: { id },
      data,
      include: {
        employee: true,
        team: true,
      }
    });
    this.notificationService.broadcast('task:updated', updated);
    return updated;
  }
}
