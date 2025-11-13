import { Controller, Get, UseGuards } from '@nestjs/common';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { FraudService } from './fraud.service';

@Controller('admin/fraud')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get('overview')
  getOverview() {
    return this.fraudService.getOverview();
  }
}
