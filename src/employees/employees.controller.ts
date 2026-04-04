import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('employee')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('employees')
export class EmployeesController {

  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List all employees' })
  @ApiResponse({ status: 200, description: 'Return all employees.' })
  findAll() {
    return this.employeesService.findAll();
  }

  @Get('departments')
  @ApiOperation({ summary: 'List all departments' })
  @ApiResponse({ status: 200, description: 'Return all departments.' })
  findAllDepartments() {
    return this.employeesService.findAllDepartments();
  }

  @Get('positions')
  @ApiOperation({ summary: 'List all positions' })
  @ApiResponse({ status: 200, description: 'Return all positions.' })
  findAllPositions() {
    return this.employeesService.findAllPositions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Return employee data.' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new employee' })
  @ApiBody({ schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Employee created.' })
  create(@Body() data: any) {
    return this.employeesService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee data' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Employee updated.' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.employeesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Employee removed.' })
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}

