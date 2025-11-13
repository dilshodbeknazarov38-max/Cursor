import { Body, Controller, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { UserStatus } from '@prisma/client';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { AdminListUsersQueryDto } from './dto/admin-list-users-query.dto';
import { UpdateUserBlockDto } from './dto/update-user-block.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    role: string;
  };
};

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async listUsers(@Query() query: AdminListUsersQueryDto) {
    return this.usersService.adminListUsers(query);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.updateRole(id, dto.roleSlug, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Put(':id/block')
  async updateBlockStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserBlockDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const status = dto.block ? UserStatus.BLOCKED : UserStatus.ACTIVE;
    return this.usersService.updateStatus(id, status, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
      reason: dto.reason,
    });
  }
}
