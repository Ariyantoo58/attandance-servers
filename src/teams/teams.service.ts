import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto) {
    const { memberIds, ...teamData } = createTeamDto;
    
    return this.prisma.team.create({
      data: {
        ...teamData,
        members: {
          create: memberIds?.map(id => ({ employeeId: id })) || [],
        },
      },
      include: {
        leader: true,
        members: {
          include: {
            employee: true
          }
        },
      },
    });
  }

  async findAll() {
    return this.prisma.team.findMany({
      include: {
        leader: true,
        _count: {
            select: { members: true }
        },
        members: {
          include: {
            employee: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        leader: true,
        members: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto) {
    const { memberIds, ...teamData } = updateTeamDto;

    const updateData: any = { ...teamData };
    
    if (memberIds) {
      updateData.members = {
        deleteMany: {}, 
        create: memberIds.map(empId => ({ employeeId: empId })),
      };
    }

    return this.prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        leader: true,
        members: {
          include: {
            employee: true,
          },
        }
      }
    });
  }

  async remove(id: string) {
    await this.prisma.teamMember.deleteMany({
      where: { teamId: id },
    });

    return this.prisma.team.delete({
      where: { id },
    });
  }

  async getMyTeams(employeeId: string) {
    return this.prisma.team.findMany({
      where: {
        OR: [
          { leaderId: employeeId },
          { members: { some: { employeeId } } },
        ],
      },
      include: {
        leader: true,
        members: {
          include: {
            employee: true,
          },
        },
      },
    });
  }
}
