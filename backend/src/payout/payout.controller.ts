import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

import { CreatePayoutDto } from './dto/create-payout.dto';
import { PayoutService } from './payout.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
  };
};

@Controller('payouts')
@UseGuards(JwtAuthGuard)
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Get('me')
  async getMyPayouts(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Foydalanuvchi aniqlanmadi.');
    }

    return this.payoutService.getMyPayouts(userId);
  }

  @Post()
  async createPayout(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePayoutDto,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Foydalanuvchi aniqlanmadi.');
    }

    return this.payoutService.createPayout(userId, dto);
  }
}
