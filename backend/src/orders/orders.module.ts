import { Module } from '@nestjs/common';

import { ActivityModule } from '@/activity/activity.module';
import { BalanceModule } from '@/balance/balance.module';
import { BalancesModule } from '@/balances/balances.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { WarehouseModule } from '@/warehouse/warehouse.module';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    PrismaModule,
    ActivityModule,
    NotificationsModule,
    BalancesModule,
    BalanceModule,
    WarehouseModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
