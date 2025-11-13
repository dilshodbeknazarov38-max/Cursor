import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadNoteDto } from './dto/update-lead-status.dto';
import { LeadsService } from './leads.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    role: string;
  };
};

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  create(@Body() dto: CreateLeadDto, @Req() req: Request) {
    return this.leadsService.createPublicLead(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });
  }

  @Get('new')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OPERATOR', 'OPER_ADMIN')
  getNew(@Req() req: AuthenticatedRequest) {
    return this.leadsService.getOperatorQueue({
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Put(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OPERATOR', 'OPER_ADMIN')
  assign(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.leadsService.assignLead(id, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Put(':id/callback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OPERATOR', 'OPER_ADMIN')
  markCallback(
    @Param('id') id: string,
    @Body() dto: LeadNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.markCallback(id, dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OPERATOR', 'OPER_ADMIN')
  cancel(
    @Param('id') id: string,
    @Body() dto: LeadNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.cancelLead(id, dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Put(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OPERATOR', 'OPER_ADMIN')
  confirm(
    @Param('id') id: string,
    @Body() dto: LeadNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leadsService.confirmLead(id, dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }
}
