import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ReimbursementService } from './reimbursement.service';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { UpdateReimbursementStatusDto } from './dto/update-reimbursement-status.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('reimbursement')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('reimbursement')
export class ReimbursementController {
  constructor(private readonly reimbursementService: ReimbursementService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new reimbursement claim' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        amount: { type: 'number' },
        date: { type: 'string', format: 'date' },
        receipt: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: diskStorage({
        destination: './uploads/receipts',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(
    @Request() req,
    @Body() createDto: CreateReimbursementDto,
    @UploadedFile() file: any,
  ) {
    const employeeId = req.user.employeeId;
    const receiptUrl = file ? `/uploads/receipts/${file.filename}` : null;
    return this.reimbursementService.create(employeeId, createDto, receiptUrl);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current employee reimbursements' })
  async findMy(@Request() req) {
    const employeeId = req.user.employeeId;
    return this.reimbursementService.findMyReimbursements(employeeId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a pending reimbursement claim' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: diskStorage({
        destination: './uploads/receipts',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: CreateReimbursementDto,
    @UploadedFile() file: any,
  ) {
    const employeeId = req.user.employeeId;
    const receiptUrl = file ? `/uploads/receipts/${file.filename}` : undefined;
    return this.reimbursementService.update(id, employeeId, updateDto, receiptUrl);
  }

  @Get('all')

  @ApiOperation({ summary: 'Get all reimbursements (HR/Admin)' })
  async findAll() {
    return this.reimbursementService.findAll();
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update reimbursement status (HR/Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateReimbursementStatusDto,
  ) {
    return this.reimbursementService.updateStatus(id, updateDto);
  }
}
