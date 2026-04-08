import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { UpdateReimbursementStatusDto } from './dto/update-reimbursement-status.dto';

@Injectable()
export class ReimbursementService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async create(employeeId: string, createDto: CreateReimbursementDto, receiptUrl?: string) {
    const reimbursement = await this.prisma.reimbursement.create({
      data: {
        employeeId,
        title: createDto.title,
        description: createDto.description,
        category: createDto.category,
        amount: createDto.amount,
        date: new Date(createDto.date),
        receiptUrl,
        status: 'PENDING',
      },
      include: { employee: true },
    });

    // Notify HR
    this.notificationService.notifyHR(
      'Pengajuan Reimbursement Baru',
      `${reimbursement.employee.name} mengajukan reimbursement sebesar Rp ${reimbursement.amount.toLocaleString()}.`,
    );

    return reimbursement;
  }

  async findAll() {
    return this.prisma.reimbursement.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyReimbursements(employeeId: string) {
    return this.prisma.reimbursement.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, employeeId: string, updateDto: CreateReimbursementDto, receiptUrl?: string) {
    const reimbursement = await this.prisma.reimbursement.findUnique({
      where: { id },
    });

    if (!reimbursement) {
      throw new NotFoundException('Reimbursement not found');
    }

    if (reimbursement.employeeId !== employeeId) {
      throw new NotFoundException('Reimbursement not found or access denied');
    }

    if (reimbursement.status !== 'PENDING') {
      throw new Error('Only pending reimbursements can be updated');
    }

    const data: any = {
      title: updateDto.title,
      description: updateDto.description,
      category: updateDto.category,
      amount: updateDto.amount,
      date: new Date(updateDto.date),
    };

    if (receiptUrl) {
      data.receiptUrl = receiptUrl;
    }

    return this.prisma.reimbursement.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, updateDto: UpdateReimbursementStatusDto) {

    const reimbursement = await this.prisma.reimbursement.findUnique({
      where: { id },
      include: { employee: { include: { user: true } } },
    });

    if (!reimbursement) {
      throw new NotFoundException('Reimbursement not found');
    }

    const updated = await this.prisma.reimbursement.update({
      where: { id },
      data: {
        status: updateDto.status,
        adminNote: updateDto.adminNote,
      },
    });

    if (reimbursement.employee.user) {
      this.notificationService.notifyUser(
        reimbursement.employee.user.id,
        `Status Reimbursement: ${updateDto.status}`,
        `Pengajuan reimbursement Anda senilai Rp ${reimbursement.amount.toLocaleString()} telah ${updateDto.status.toLowerCase()}.`,
        { status: updateDto.status }
      );
    }

    return updated;
  }
}
