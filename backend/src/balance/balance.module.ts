import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';

@Module({
  imports: [PrismaModule],
  controllers: [BalanceController],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}
