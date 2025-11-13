import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('landing')
  getLandingStats() {
    return this.statsService.getLandingStats();
  }

  @Get('dashboard/:role')
  @UseGuards(JwtAuthGuard)
  getDashboardStats(@Param('role') role: string, @Req() req: Request) {
    const user = req.user as { sub?: string } | undefined;
    return this.statsService.getDashboardStats(role, user?.sub ?? '');
  }

  @Get('admin/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getAdminOverview() {
    return this.statsService.getAdminOverview();
  }

  @Get('me/analytics')
  @UseGuards(JwtAuthGuard)
  getPersonalAnalytics(@Req() req: Request) {
    const user = req.user as { sub?: string; role?: string } | undefined;
    return this.statsService.getPersonalAnalytics(
      user?.role ?? '',
      user?.sub ?? '',
    );
  }
}
