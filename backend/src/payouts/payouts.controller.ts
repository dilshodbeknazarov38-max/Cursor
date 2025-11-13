import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PayoutStatus } from '@prisma/client';
import type { Request } from 'express';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutStatusDto } from './dto/update-payout-status.dto';
import { PayoutsService } from './payouts.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    role: string;
  };
};

@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post()
  @Roles(
    'TARGETOLOG',
    'OPERATOR',
    'TAMINOTCHI',
    'TARGET_ADMIN',
    'OPER_ADMIN',
    'SKLAD_ADMIN',
    'ADMIN',
    'SUPER_ADMIN',
  )
  request(
    @Body() dto: CreatePayoutDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.payoutsService.requestPayout(dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Get()
  @Roles(
    'TARGETOLOG',
    'OPERATOR',
    'TAMINOTCHI',
    'TARGET_ADMIN',
    'OPER_ADMIN',
    'SKLAD_ADMIN',
    'ADMIN',
    'SUPER_ADMIN',
  )
  list(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: PayoutStatus,
  ) {
    const uppercased = status ? String(status).toUpperCase() : undefined;
    const normalizedStatus =
      uppercased &&
      (Object.values(PayoutStatus) as string[]).includes(uppercased)
        ? (uppercased as PayoutStatus)
        : undefined;
    return this.payoutsService.list(
      {
        userId: req.user?.sub ?? '',
        role: req.user?.role ?? '',
      },
      { status: normalizedStatus },
    );
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePayoutStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.payoutsService.updateStatus(id, dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }
}
