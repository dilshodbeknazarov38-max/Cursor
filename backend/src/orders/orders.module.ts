import { Module } from '@nestjs/common';

import { ActivityModule } from '@/activity/activity.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { PrismaModule } from '@/prisma/prisma.module';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PrismaModule, ActivityModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
