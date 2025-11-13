import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ActivityModule } from '@/activity/activity.module';
import { AuthModule } from '@/auth/auth.module';
import { BalancesModule } from '@/balances/balances.module';
import { APP_CONFIG } from '@/config/app.config';
import { validate } from '@/config/env.validation';
import { LeadsModule } from '@/leads/leads.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { OrdersModule } from '@/orders/orders.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { PayoutsModule } from '@/payouts/payouts.module';
import { ProductsModule } from '@/products/products.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { RolesModule } from '@/roles/roles.module';
import { StatsModule } from '@/stats/stats.module';
import { UsersModule } from '@/users/users.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [APP_CONFIG],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 120,
      },
    ]),
    PrismaModule,
    UsersModule,
    RolesModule,
    StatsModule,
    PermissionsModule,
      AuthModule,
      ProductsModule,
      LeadsModule,
      OrdersModule,
      PayoutsModule,
      NotificationsModule,
      ActivityModule,
      BalancesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
