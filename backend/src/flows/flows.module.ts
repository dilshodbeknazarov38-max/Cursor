import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { FlowsController } from './flows.controller';
import { FlowsService } from './flows.service';

@Module({
  imports: [PrismaModule],
  controllers: [FlowsController],
  providers: [FlowsService],
  exports: [FlowsService],
})
export class FlowsModule {}
