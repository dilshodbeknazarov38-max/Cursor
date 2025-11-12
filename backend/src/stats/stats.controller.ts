import { Controller, Get, Param } from '@nestjs/common';

import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('landing')
  getLandingStats() {
    return this.statsService.getLandingStats();
  }

  @Get('dashboard/:role')
  getDashboardStats(@Param('role') role: string) {
    return this.statsService.getDashboardStats(role);
  }
}
