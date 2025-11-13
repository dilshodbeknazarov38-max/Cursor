import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { ActivityModule } from '@/activity/activity.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { PrismaModule } from '@/prisma/prisma.module';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    PrismaModule,
    ActivityModule,
    NotificationsModule,
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
