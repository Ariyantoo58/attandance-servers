import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PayrollService } from './payroll.service';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  async create(@Body() body: {
    employeeId: string;
    month: number;
    year: number;
    basicSalary: number;
    bonuses?: number;
    deductions?: number;
  }) {
    return this.payrollService.createPayroll(body);
  }

  @Get('employee/:employeeId')
  async getEmployeePayroll(@Param('employeeId') employeeId: string) {
    return this.payrollService.getEmployeePayroll(employeeId);
  }
}
