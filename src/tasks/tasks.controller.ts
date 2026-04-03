import { Controller, Post, Get, Body, Param, Patch } from '@nestjs/common';
import { TaskService } from './tasks.service';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(@Body() body: {
    employeeId: string;
    title: string;
    description?: string;
    date?: string;
    priority?: string;
  }) {
    return this.taskService.createTask(body);
  }

  @Get('employee/:employeeId')
  async getEmployeeTasks(@Param('employeeId') employeeId: string) {
    return this.taskService.getTasksByEmployee(employeeId);
  }

  @Get('all')
  async getAll() {
    return this.taskService.getAllTasks();
  }

  @Patch('update-status/:id')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.taskService.updateTaskStatus(id, body.status);
  }
}
