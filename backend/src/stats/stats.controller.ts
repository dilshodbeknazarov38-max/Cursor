import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

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
