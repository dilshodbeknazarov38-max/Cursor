import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CreateFlowDto } from './dto/create-flow.dto';
import { FlowsService } from './flows.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    role: string;
  };
};

@Controller('flows')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Post()
  @Roles('TARGETOLOG')
  create(@Body() dto: CreateFlowDto, @Req() req: AuthenticatedRequest) {
    return this.flowsService.create(dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Get('me')
  @Roles('TARGETOLOG')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.flowsService.findMine({
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Get('product/:productId')
  @Roles('TARGETOLOG', 'TAMINOTCHI', 'ADMIN', 'SUPER_ADMIN', 'SKLAD_ADMIN')
  findByProduct(@Param('productId') productId: string, @Req() req: AuthenticatedRequest) {
    return this.flowsService.findByProduct(productId, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Delete(':id')
  @Roles('TARGETOLOG', 'TAMINOTCHI', 'ADMIN', 'SUPER_ADMIN', 'SKLAD_ADMIN')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.flowsService.remove(id, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }
}
