import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AttendanceCorrectionService } from './attendance-correction.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('attendance-correction')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('attendance-correction')
export class AttendanceCorrectionController {
  constructor(private readonly service: AttendanceCorrectionService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new correction request' })
  async request(@Body() body: any) {
    return this.service.requestCorrection(body.employeeId, body);
  }

  @Get('my/:employeeId')
  @ApiOperation({ summary: 'Get employee\'s own correction requests' })
  async getMy(@Param('employeeId') employeeId: string) {
    return this.service.getMyCorrections(employeeId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending requests (Admin)' })
  async getPending() {
    return this.service.getAllPendingCorrections();
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve or Reject a request' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; adminNote?: string },
  ) {
    return this.service.updateStatus(id, body.status, body.adminNote);
  }
}
