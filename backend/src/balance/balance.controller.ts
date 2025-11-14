import { Controller, Get, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

import { BalanceService } from './balance.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
  };
};

@Controller('balance')
@UseGuards(JwtAuthGuard)
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('me')
  async getMyBalance(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Foydalanuvchi aniqlanmadi.');
    }

    return this.balanceService.getUserOverview(userId);
  }
}
