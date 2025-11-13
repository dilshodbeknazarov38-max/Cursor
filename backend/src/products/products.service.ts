import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FlowStatus, Prisma, ProductStatus } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type AuthContext = {
  userId: string;
  role: string;
};

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'SKLAD_ADMIN']);

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateProductDto, context: AuthContext) {
    this.assertRole(context.role, ['TAMINOTCHI']);

    const product = await this.prisma.product.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        price: new Prisma.Decimal(dto.price),
        images: this.normalizeImages(dto.images),
        stock: dto.stock ?? 0,
        status: ProductStatus.PENDING,
        ownerId: context.userId,
      },
    });

    return this.toProductResponse(product);
  }

  async findMine(context: AuthContext, status?: ProductStatus | string) {
    this.assertRole(context.role, ['TAMINOTCHI']);

    const where: Prisma.ProductWhereInput = {
      ownerId: context.userId,
    };

    const normalizedStatus = this.normalizeStatus(status);
    if (normalizedStatus) {
      where.status = normalizedStatus;
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => this.toProductResponse(product));
  }

  async findAll(status?: ProductStatus | string) {
    const normalizedStatus = this.normalizeStatus(status);
    const products = await this.prisma.product.findMany({
      where: normalizedStatus ? { status: normalizedStatus } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nickname: true,
            phone: true,
          },
        },
      },
    });

    return products.map((product) => this.toProductResponse(product));
  }

  async findApproved() {
    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.APPROVED },
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        images: true,
        stock: true,
        updatedAt: true,
      },
    });

    return products.map((product) => ({
      ...product,
      price: new Prisma.Decimal(product.price).toFixed(2),
    }));
  }

  async findOne(id: string, context: AuthContext) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nickname: true,
            phone: true,
          },
        },
        flows: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }

    if (ADMIN_ROLES.has(context.role)) {
      return this.toProductResponse(product);
    }

    if (context.role === 'TAMINOTCHI' && product.ownerId === context.userId) {
      return this.toProductResponse(product);
    }

    if (context.role === 'TARGETOLOG' && product.status === ProductStatus.APPROVED) {
      return this.toProductResponse(product);
    }

    throw new ForbiddenException('Mahsulotga kirish huquqi mavjud emas.');
  }

  async update(id: string, dto: UpdateProductDto, context: AuthContext) {
    this.assertRole(context.role, ['TAMINOTCHI']);

    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }
    if (product.ownerId !== context.userId) {
      throw new ForbiddenException('Faqat o‘z mahsulotingizni tahrirlashingiz mumkin.');
    }
    const data: Prisma.ProductUpdateInput = {};

    const markPending =
      product.status === ProductStatus.APPROVED ||
      product.status === ProductStatus.REJECTED;

    if (dto.title !== undefined) {
      if (product.status !== ProductStatus.PENDING) {
        throw new BadRequestException(
          'Tasdiqlangan mahsulot nomini o‘zgartirib bo‘lmaydi.',
        );
      }
      data.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      data.description = dto.description.trim();
      if (markPending) {
        data.status = ProductStatus.PENDING;
      }
    }
    if (dto.price !== undefined) {
      if (dto.price <= 0) {
        throw new BadRequestException('Narx musbat son bo‘lishi kerak.');
      }
      data.price = new Prisma.Decimal(dto.price);
      if (markPending) {
        data.status = ProductStatus.PENDING;
      }
    }
    if (dto.images !== undefined) {
      data.images = this.normalizeImages(dto.images);
      if (markPending) {
        data.status = ProductStatus.PENDING;
      }
    }
    if (dto.stock !== undefined) {
      throw new BadRequestException(
        'Zaxirani alohida “Ombor” bo‘limida boshqaring.',
      );
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });

    return this.toProductResponse(updated);
  }

  async remove(id: string, context: AuthContext) {
    this.assertRole(context.role, ['TAMINOTCHI']);

    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        status: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }
    if (product.ownerId !== context.userId) {
      throw new ForbiddenException('Faqat o‘z mahsulotingizni o‘chira olasiz.');
    }
    if (product.status !== ProductStatus.PENDING) {
      throw new BadRequestException(
        'Faqat kutilayotgan (PENDING) mahsulotni o‘chirish mumkin.',
      );
    }

    await this.prisma.product.delete({ where: { id } });
    return { message: 'Mahsulot o‘chirildi.' };
  }

  async approve(id: string, context: AuthContext) {
    this.assertRole(context.role, ['SKLAD_ADMIN']);

    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }
    if (product.status !== ProductStatus.PENDING) {
      throw new BadRequestException('Faqat kutilayotgan mahsulotni tasdiqlash mumkin.');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.APPROVED,
      },
    });

    return this.toProductResponse(updated);
  }

  async reject(id: string, context: AuthContext) {
    this.assertRole(context.role, ['SKLAD_ADMIN']);

    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }
    if (product.status !== ProductStatus.PENDING) {
      throw new BadRequestException('Faqat kutilayotgan mahsulotni rad etish mumkin.');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        status: ProductStatus.REJECTED,
      },
    });

    return this.toProductResponse(updated);
  }

  private assertRole(role: string, allowed: string[]) {
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Bu amalni bajarish uchun ruxsat yo‘q.');
    }
  }

  private normalizeStatus(status?: ProductStatus | string) {
    if (!status) {
      return undefined;
    }

    const value = status
      .toString()
      .trim()
      .toUpperCase() as ProductStatus;

    if ((Object.values(ProductStatus) as string[]).includes(value)) {
      return value;
    }

    throw new BadRequestException('Status noto‘g‘ri kiritildi.');
  }

  private normalizeImages(images?: string[]) {
    if (!images) {
      return [];
    }

    return images
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, 10);
  }

  private toProductResponse(
    product: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      title: string;
      description: string;
      price: Prisma.Decimal | number;
      images: string[];
      stock: number;
      reservedStock?: number;
      status: ProductStatus;
      ownerId: string;
      owner?: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        nickname: string;
        phone: string;
      } | null;
      flows?: Array<{
        id: string;
        title: string;
        slug: string;
        url: string;
        status: FlowStatus;
        clicks: number;
        leads: number;
        orders: number;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
        productId: string;
      }>;
    },
  ) {
      const publicBase =
        this.configService.get<string>('app.publicUrl') ?? 'http://localhost:3001';
      const cleanBase = publicBase.replace(/\/$/, '');

      return {
        ...product,
        price: new Prisma.Decimal(product.price).toFixed(2),
        owner: product.owner ?? undefined,
      reservedStock: product.reservedStock ?? 0,
        flows: product.flows
          ? product.flows.map((flow) => ({
              ...flow,
              trackingUrl: `${cleanBase}/f/${flow.slug}`,
            }))
          : undefined,
      };
    }
}
