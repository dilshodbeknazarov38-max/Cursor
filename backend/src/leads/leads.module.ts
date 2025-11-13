import { Module } from '@nestjs/common';

import { ActivityModule } from '@/activity/activity.module';
import { BalanceModule } from '@/balance/balance.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { PrismaModule } from '@/prisma/prisma.module';

import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [PrismaModule, ActivityModule, NotificationsModule, BalanceModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
