import { Module } from '@nestjs/common';

import { ActivityModule } from '@/activity/activity.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { PrismaModule } from '@/prisma/prisma.module';

import { BalancesController } from './balances.controller';
import { BalancesService } from './balances.service';

@Module({
  imports: [PrismaModule, ActivityModule, NotificationsModule],
  controllers: [BalancesController],
  providers: [BalancesService],
  exports: [BalancesService],
})
export class BalancesModule {}
