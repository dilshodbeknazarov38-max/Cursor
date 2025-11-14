import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { FlowRedirectController } from './flow-redirect.controller';
import { FlowsController } from './flows.controller';
import { FlowsService } from './flows.service';

@Module({
  imports: [PrismaModule],
  controllers: [FlowsController, FlowRedirectController],
  providers: [FlowsService],
  exports: [FlowsService],
})
export class FlowsModule {}
