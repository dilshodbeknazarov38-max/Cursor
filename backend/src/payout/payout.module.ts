import { Module } from '@nestjs/common';

import { BalanceModule } from '@/balance/balance.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { TransactionsModule } from '@/transactions/transactions.module';

import { AdminPayoutController } from './admin-payout.controller';
import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';

@Module({
  imports: [PrismaModule, BalanceModule, TransactionsModule],
  controllers: [PayoutController, AdminPayoutController],
  providers: [PayoutService],
})
export class PayoutModule {}
