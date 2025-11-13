import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { ActivityService } from './activity.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    role: string;
  };
};

@Controller('activity')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('me')
  async listMyActivity(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ) {
    const items = await this.activityService.listForUser(
      req.user?.sub ?? '',
      Number(limit),
    );

    return {
      message: 'So‘nggi faollik yozuvlari muvaffaqiyatli olindi.',
      items,
    };
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listAll(@Query('limit') limit?: string) {
    const items = await this.activityService.listRecent(Number(limit));
    return {
      message: 'Tizim faollik jurnali muvaffaqiyatli olindi.',
      items,
    };
  }

  @Get('user/:userId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listForUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const items = await this.activityService.listForUser(
      userId,
      Number(limit),
    );
    return {
      message: 'Foydalanuvchi faollik jurnali muvaffaqiyatli olindi.',
      items,
    };
  }
}
