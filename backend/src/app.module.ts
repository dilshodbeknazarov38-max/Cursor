import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { APP_CONFIG } from '@/config/app.config';
import { validate } from '@/config/env.validation';
import { AuthModule } from '@/auth/auth.module';
import { PermissionsModule } from '@/permissions/permissions.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { RolesModule } from '@/roles/roles.module';
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
    PrismaModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
