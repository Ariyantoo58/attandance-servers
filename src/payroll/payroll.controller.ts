import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
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
    overtime?: number;
    bonuses?: number;
    pph21?: number;
    bpjsKetenagakerjaan?: number;
    bpjsKesehatan?: number;
    lateDeduction?: number;
    otherDeductions?: number;
  }) {
    return this.payrollService.createPayroll(body);
  }

  @Get('monthly')
  async getMonthlyPayrolls(@Query('month') month: string, @Query('year') year: string) {
    return this.payrollService.getMonthlyPayrolls(Number(month), Number(year));
  }

  @Get('employee/:employeeId')
  async getEmployeePayroll(@Param('employeeId') employeeId: string) {
    return this.payrollService.getEmployeePayroll(employeeId);
  }
}
