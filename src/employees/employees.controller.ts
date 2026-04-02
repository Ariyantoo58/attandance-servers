import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  findAll() {
    return this.employeesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Post()
  create(@Body() data: { name: string; role?: string; email?: string }) {
    return this.employeesService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: { name?: string; role?: string; email?: string }) {
    return this.employeesService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
