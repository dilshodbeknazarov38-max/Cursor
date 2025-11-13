import {
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { QueryAdminPayoutsDto } from './dto/query-admin-payouts.dto';
import { PayoutService } from './payout.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
  };
};

@Controller('admin/payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminPayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Get()
  async getAll(@Query() query: QueryAdminPayoutsDto) {
    return this.payoutService.getAdminPayouts(query);
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Foydalanuvchi aniqlanmadi.');
    }

    return this.payoutService.approvePayout(id, userId);
  }

  @Put(':id/reject')
  async reject(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Foydalanuvchi aniqlanmadi.');
    }

    return this.payoutService.rejectPayout(id, userId);
  }
}
