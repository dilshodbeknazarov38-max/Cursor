import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';
import { TransactionsModule } from '@/transactions/transactions.module';

import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';

@Module({
  imports: [PrismaModule, TransactionsModule],
  controllers: [BalanceController],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}
