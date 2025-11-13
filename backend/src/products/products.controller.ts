import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { Request } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

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
    'TARGET_ADMIN',
    'OPER_ADMIN',
    'SKLAD_ADMIN',
    'TARGETOLOG',
    'OPERATOR',
    'TAMINOTCHI',
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
    return this.productsService.findAll(
      {
        role: req.user?.role ?? '',
        userId: req.user?.sub ?? '',
      },
      {
      status: normalizedStatus,
      },
    );
  }

  @Get(':id')
  @Roles(
    'ADMIN',
    'SUPER_ADMIN',
    'TARGET_ADMIN',
    'OPER_ADMIN',
    'TARGETOLOG',
    'OPERATOR',
    'SKLAD_ADMIN',
    'TAMINOTCHI',
  )
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.findOne(id, {
      role: req.user?.role ?? '',
      userId: req.user?.sub ?? '',
    });
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mainImage', maxCount: 1 },
      { name: 'creative', maxCount: 1 },
    ]),
  )
  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN', 'TAMINOTCHI')
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles()
    files: {
      mainImage?: Express.Multer.File[];
      creative?: Express.Multer.File[];
    },
    @Req() req: AuthenticatedRequest,
  ) {
    const mainImage = files?.mainImage?.[0];
    if (!mainImage) {
      throw new BadRequestException('Asosiy rasm yuklash majburiy.');
    }

    return this.productsService.create(
      dto,
      {
        userId: req.user?.sub ?? '',
        role: req.user?.role ?? '',
      },
      {
        mainImage,
        creative: files?.creative?.[0],
      },
    );
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mainImage', maxCount: 1 },
      { name: 'creative', maxCount: 1 },
    ]),
  )
  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'TAMINOTCHI')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles()
    files: {
      mainImage?: Express.Multer.File[];
      creative?: Express.Multer.File[];
    },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productsService.update(
      id,
      dto,
      {
        userId: req.user?.sub ?? '',
        role: req.user?.role ?? '',
      },
      {
        mainImage: files?.mainImage?.[0],
        creative: files?.creative?.[0],
      },
    );
  }

  @Patch(':id/archive')
  @Roles('ADMIN', 'SUPER_ADMIN')
  archive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.archive(id, {
      userId: req.user?.sub ?? '',
      role: req.user?.role ?? '',
    });
  }
}
