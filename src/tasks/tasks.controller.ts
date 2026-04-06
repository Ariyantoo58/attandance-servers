import { Controller, Post, Get, Body, Param, Patch, Query } from '@nestjs/common';
import { TaskService } from './tasks.service';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(@Body() body: {
    employeeIds?: string[];
    teamId?: string;
    title: string;
    description?: string;
    date?: string;
    dueDate?: string;
    priority?: string;
    category?: string;
  }) {
    return this.taskService.createTask(body);
  }

  @Get('employee/:employeeId')
  async getEmployeeTasks(@Param('employeeId') employeeId: string) {
    return this.taskService.getTasksByEmployee(employeeId);
  }

  @Get('all')
  async getAll(@Query() query: any) {
    return this.taskService.getAllTasks(query);
  }

  @Patch('update-status/:id')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.taskService.updateTaskStatus(id, body.status);
  }

  @Patch('update-progress/:id')
  async updateProgress(@Param('id') id: string, @Body() body: { progress: number }) {
    return this.taskService.updateTaskProgress(id, Number(body.progress));
  }

  @Patch(':id')
  async updateTask(@Param('id') id: string, @Body() body: any) {
    return this.taskService.updateTask(id, body);
  }
}
