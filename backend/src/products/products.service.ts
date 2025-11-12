import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';

import { ActivityService } from '@/activity/activity.service';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type AuthContext = {
  userId: string;
  role: string;
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  async create(dto: CreateProductDto, context: AuthContext) {
    this.ensureManagePermission(context.role);
    const sellerId = dto.sellerId ?? context.userId;

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: new Prisma.Decimal(dto.price),
        status: dto.status ?? ProductStatus.DRAFT,
        sellerId,
      },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            nickname: true,
            phone: true,
          },
        },
      },
    });

    await this.activityService.log({
      userId: context.userId,
      action: `Mahsulot yaratildi: ${product.name}`,
      meta: {
        productId: product.id,
        status: product.status,
      },
    });

    return product;
  }

  async findAll(role: string, filter?: { status?: ProductStatus }) {
    const where: Prisma.ProductWhereInput = {};
    if (filter?.status) {
      where.status = filter.status;
    } else if (role === 'TARGETOLOG' || role === 'OPERATOR') {
      where.status = ProductStatus.ACTIVE;
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, role: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            nickname: true,
            phone: true,
          },
        },
      },
    });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }

    if (
      product.status !== ProductStatus.ACTIVE &&
      !['ADMIN', 'SELLER_ADMIN', 'SUPER_ADMIN', 'TARGET_ADMIN'].includes(role)
    ) {
      throw new ForbiddenException(
        'Bu mahsulotni ko‘rish uchun ruxsatingiz yo‘q.',
      );
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto, context: AuthContext) {
    this.ensureManagePermission(context.role);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        description: dto.description ?? existing.description,
        price:
          dto.price !== undefined
            ? new Prisma.Decimal(dto.price)
            : existing.price,
        status: dto.status ?? existing.status,
        sellerId: dto.sellerId ?? existing.sellerId,
      },
    });

    await this.activityService.log({
      userId: context.userId,
      action: `Mahsulot yangilandi: ${product.name}`,
      meta: {
        productId: product.id,
        status: product.status,
      },
    });

    return product;
  }

  async archive(id: string, context: AuthContext) {
    this.ensureManagePermission(context.role);
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.ARCHIVED,
      },
    });

    await this.activityService.log({
      userId: context.userId,
      action: `Mahsulot arxivlandi: ${product.name}`,
      meta: {
        productId: product.id,
      },
    });

    return {
      message: 'Mahsulot arxivga yuborildi.',
      product,
    };
  }

  private ensureManagePermission(role: string) {
    if (!['ADMIN', 'SELLER_ADMIN'].includes(role)) {
      throw new ForbiddenException(
        'Mahsulotlarni boshqarish uchun ruxsatingiz yo‘q.',
      );
    }
  }
}
