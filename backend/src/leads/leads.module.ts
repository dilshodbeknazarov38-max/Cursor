import { Module } from '@nestjs/common';

import { ActivityModule } from '@/activity/activity.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { PrismaModule } from '@/prisma/prisma.module';

import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [PrismaModule, ActivityModule, NotificationsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
