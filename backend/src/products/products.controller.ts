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
import { ProductStatus } from '@prisma/client';
import { Request } from 'express';

import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
    role: string;
  };
};

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Roles(
    'ADMIN',
    'SUPER_ADMIN',
    'SELLER_ADMIN',
    'TARGET_ADMIN',
    'TARGETOLOG',
    'OPERATOR',
    'SKLAD_ADMIN',
  )
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: ProductStatus,
  ) {
    const uppercased = status ? String(status).toUpperCase() : undefined;
    const normalizedStatus =
      uppercased &&
      (Object.values(ProductStatus) as string[]).includes(uppercased)
        ? (uppercased as ProductStatus)
        : undefined;
    return this.productsService.findAll(req.user?.role ?? '', {
      status: normalizedStatus,
    });
  }

  @Get(':id')
  @Roles(
    'ADMIN',
    'SUPER_ADMIN',
    'SELLER_ADMIN',
    'TARGET_ADMIN',
    'TARGETOLOG',
    'OPERATOR',
    'SKLAD_ADMIN',
  )
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.findOne(id, req.user?.role ?? '');
  }

  @Post()
  @Roles('ADMIN', 'SELLER_ADMIN')
  create(
    @Body() dto: CreateProductDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.create(dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Patch(':id')
  @Roles('ADMIN', 'SELLER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.update(id, dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Patch(':id/archive')
  @Roles('ADMIN', 'SELLER_ADMIN')
  archive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.archive(id, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }
}
