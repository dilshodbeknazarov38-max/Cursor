import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Request } from 'express';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { AssignOperatorDto } from './dto/assign-operator.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    role: string;
  };
};

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('ADMIN', 'OPER_ADMIN', 'TARGET_ADMIN')
  create(
    @Body() dto: CreateOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.create(dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Get()
  @Roles(
    'ADMIN',
    'OPER_ADMIN',
    'TARGET_ADMIN',
    'TARGETOLOG',
    'OPERATOR',
    'SKLAD_ADMIN',
    'SUPER_ADMIN',
  )
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: OrderStatus,
    @Query('productId') productId?: string,
  ) {
    const uppercased = status ? String(status).toUpperCase() : undefined;
    const normalizedStatus =
      uppercased &&
      (Object.values(OrderStatus) as string[]).includes(uppercased)
        ? (uppercased as OrderStatus)
        : undefined;
    return this.ordersService.findAll(
      {
        userId: req.user?.sub ?? '',
        role: req.user?.role ?? '',
      },
      { status: normalizedStatus, productId },
    );
  }

  @Patch(':id/assign')
  @Roles('ADMIN', 'OPER_ADMIN')
  assignOperator(
    @Param('id') id: string,
    @Body() dto: AssignOperatorDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.assignOperator(id, dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'OPER_ADMIN', 'OPERATOR', 'SKLAD_ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.updateStatus(id, dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Patch(':id/archive')
  @Roles('ADMIN')
  archive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.ordersService.archive(id, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }
}
