import { Module } from '@nestjs/common';

import { ActivityModule } from '@/activity/activity.module';
import { BalancesModule } from '@/balances/balances.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { PrismaModule } from '@/prisma/prisma.module';

import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';

@Module({
  imports: [PrismaModule, ActivityModule, NotificationsModule, BalancesModule],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
