import { Body, Controller, Delete, Get, Param, Put, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import type { Request } from 'express';

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

  @Post()
  @Roles('TAMINOTCHI')
  create(@Body() dto: CreateProductDto, @Req() req: AuthenticatedRequest) {
    return this.productsService.create(dto, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Get('me')
  @Roles('TAMINOTCHI')
  findMine(@Req() req: AuthenticatedRequest, @Query('status') status?: ProductStatus) {
    return this.productsService.findMine(
      {
        userId: req.user?.sub ?? '',
        role: req.user?.role ?? '',
      },
      status,
    );
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'SKLAD_ADMIN')
  findAll(@Query('status') status?: ProductStatus) {
    return this.productsService.findAll(status);
  }

  @Get('approved')
  @Roles('TARGETOLOG')
  findApproved() {
    return this.productsService.findApproved();
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'SKLAD_ADMIN', 'TAMINOTCHI', 'TARGETOLOG')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.findOne(id, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Put(':id')
  @Roles('TAMINOTCHI')
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

  @Delete(':id')
  @Roles('TAMINOTCHI')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.remove(id, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Put(':id/approve')
  @Roles('SKLAD_ADMIN')
  approve(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.approve(id, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }

  @Put(':id/reject')
  @Roles('SKLAD_ADMIN')
  reject(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.reject(id, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }
}
