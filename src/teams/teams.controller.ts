import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('teams')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  create(@Body() createTeamDto: CreateTeamDto, @Request() req: any) {
    const role = req.user.role;
    if (role !== 'HR' && role !== 'ADMIN' && role !== 'MANAGER') {
      throw new ForbiddenException('Only HR, Admin, or Manager can create teams');
    }
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teams' })
  findAll() {
    return this.teamsService.findAll();
  }

  @Get('my-teams/list')
  @ApiOperation({ summary: 'Get teams related to current user' })
  findMyTeams(@Request() req: any) {
    return this.teamsService.getMyTeams(req.user.employeeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a team by ID' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a team' })
  update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto, @Request() req: any) {
    const role = req.user.role;
    if (role !== 'HR' && role !== 'ADMIN' && role !== 'MANAGER') {
      throw new ForbiddenException('Insufficient permissions');
    }
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a team' })
  remove(@Param('id') id: string, @Request() req: any) {
    const role = req.user.role;
    if (role !== 'HR' && role !== 'ADMIN') {
      throw new ForbiddenException('Only HR or Admin can delete teams');
    }
    return this.teamsService.remove(id);
  }
}
