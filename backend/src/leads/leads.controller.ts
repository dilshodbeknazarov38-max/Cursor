import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { Request } from 'express';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { LeadsService } from './leads.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    role: string;
  };
};

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Roles('TARGETOLOG', 'TARGET_ADMIN', 'ADMIN')
  create(
    @Body() dto: CreateLeadDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.create(dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Get()
  @Roles(
    'TARGETOLOG',
    'TARGET_ADMIN',
    'ADMIN',
    'OPER_ADMIN',
    'SUPER_ADMIN',
  )
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: LeadStatus,
    @Query('productId') productId?: string,
  ) {
    const uppercased = status ? String(status).toUpperCase() : undefined;
    const normalizedStatus =
      uppercased && (Object.values(LeadStatus) as string[]).includes(uppercased)
        ? (uppercased as LeadStatus)
        : undefined;
    return this.leadsService.findAll(
      {
        userId: req.user?.sub ?? '',
        role: req.user?.role ?? '',
      },
      { status: normalizedStatus, productId },
    );
  }

  @Patch(':id/status')
  @Roles('TARGETOLOG', 'TARGET_ADMIN', 'ADMIN', 'OPER_ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.updateStatus(id, dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }
}
