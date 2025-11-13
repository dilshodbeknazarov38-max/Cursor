import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BalanceAccountType, FraudCheckStatus } from '@prisma/client';

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';

import { BalancesService } from './balances.service';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { QueryFraudChecksDto } from './dto/query-fraud-checks.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { ResolveFraudDto } from './dto/resolve-fraud.dto';

@Controller('balances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get('me')
  async getMyBalances(@Req() req: any) {
    return this.balancesService.getUserBalances(req.user.sub);
  }

  @Get('me/transactions')
  async getMyTransactions(
    @Req() req: any,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.balancesService.getUserTransactions(req.user.sub, query);
  }

  @Get(':userId')
  @Roles('ADMIN', 'SUPER_ADMIN', 'OPER_ADMIN', 'TARGET_ADMIN', 'SELLER_ADMIN')
  async getUserBalances(@Param('userId') userId: string) {
    return this.balancesService.getUserBalances(userId);
  }

  @Get(':userId/transactions')
  @Roles('ADMIN', 'SUPER_ADMIN', 'OPER_ADMIN', 'TARGET_ADMIN', 'SELLER_ADMIN')
  async getUserTransactions(
    @Param('userId') userId: string,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.balancesService.getUserTransactions(userId, query);
  }

  @Post('admin/adjust')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adjustBalance(@Body() dto: AdjustBalanceDto, @Req() req: any) {
    return this.balancesService.adminAdjustBalance(dto, {
      actorId: req.user.sub,
    });
  }

  @Get('admin/fraud')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listFraudChecks(@Query() query: QueryFraudChecksDto) {
    return this.balancesService.getFraudChecks(query.status);
  }

  @Patch('admin/fraud/:id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async resolveFraud(
    @Param('id') id: string,
    @Body() dto: ResolveFraudDto,
    @Req() req: any,
  ) {
    return this.balancesService.resolveFraudCheck(id, dto, req.user.sub);
  }

  @Get('types')
  async getAccountTypes() {
    return {
      types: Object.values(BalanceAccountType),
      fraudStatuses: Object.values(FraudCheckStatus),
    };
  }
}
