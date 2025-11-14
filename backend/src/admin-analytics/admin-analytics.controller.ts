import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { AdminAnalyticsService } from './admin-analytics.service';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  @Get('summary')
  getSummary(@Query('days') days?: string) {
    const parsed = Number(days);
    return this.analyticsService.getSummary(Number.isFinite(parsed) ? parsed : 30);
  }

  @Get('trends')
  getTrends(@Query('days') days?: string) {
    const parsed = Number(days);
    return this.analyticsService.getTrends(Number.isFinite(parsed) ? parsed : 30);
  }
}
