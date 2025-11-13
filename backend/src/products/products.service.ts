import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType, Prisma, ProductStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

import { ActivityService } from '@/activity/activity.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type AuthContext = {
  userId: string;
  role: string;
};

type ProductFilesPayload = {
  mainImage?: Express.Multer.File;
  creative?: Express.Multer.File;
};

@Injectable()
export class ProductsService {
  private readonly uploadsRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    this.uploadsRoot = path.join(process.cwd(), 'uploads', 'products');
  }

  async create(
    dto: CreateProductDto,
    context: AuthContext,
    files: ProductFilesPayload,
  ) {
    this.ensureCreatePermission(context.role);

    if (!files.mainImage) {
      throw new BadRequestException('Asosiy rasm yuklash majburiy.');
    }

    this.validateMainImage(files.mainImage);
    if (files.creative) {
      this.validateCreative(files.creative);
    }

    const slug = await this.generateUniqueSlug(dto.name);
    const mainImageUrl = await this.saveMainImage(files.mainImage, slug);
    const creativeUrl = files.creative
      ? await this.saveCreativeFile(files.creative, slug)
      : undefined;

    const sellerId = this.resolveSellerId(dto.sellerId, context);
    const status = this.resolveInitialStatus(dto.status, context.role);
    const smartLinkUrl = this.buildSmartLink(slug);
    const tags = this.normalizeStringArray(dto.tags);
    const trafficSources = this.normalizeStringArray(dto.trafficSources);

    const product = await this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        slug,
        category: dto.category.trim(),
        shortDescription: dto.shortDescription.trim(),
        fullDescription: dto.fullDescription?.trim() ?? null,
        price: new Prisma.Decimal(dto.price),
        cpaTargetolog:
          dto.cpaTargetolog !== undefined
            ? new Prisma.Decimal(dto.cpaTargetolog)
            : null,
        cpaOperator:
          dto.cpaOperator !== undefined
            ? new Prisma.Decimal(dto.cpaOperator)
            : null,
        mainImageUrl,
        creativeUrl: creativeUrl ?? null,
        seoTitle: dto.seoTitle?.trim() ?? null,
        seoDescription: dto.seoDescription?.trim() ?? null,
        tags,
        trafficSources,
        smartLinkUrl,
        marketplaceId: dto.marketplaceId?.trim() ?? null,
        externalUrl: dto.externalUrl?.trim() ?? null,
        status,
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

    if (context.role === 'TAMINOTCHI') {
      await this.notifyAdminsOnPendingProduct(product.id, product.name, sellerId);
    }

    if (
      product.status === ProductStatus.ACTIVE &&
      product.seller &&
      context.role !== 'TAMINOTCHI'
    ) {
      await this.notificationsService.create({
        toUserId: product.seller.id,
        message: `${product.name} mahsuloti tasdiqlandi.`,
        type: NotificationType.SYSTEM,
        metadata: {
          productId: product.id,
        },
      });
    }

    return {
      message: 'Mahsulot muvaffaqiyatli qo‘shildi.',
      product,
    };
  }

  async findAll(
    context: AuthContext,
    filter?: { status?: ProductStatus },
  ) {
    const role = context.role;
    const where: Prisma.ProductWhereInput = {};
    if (filter?.status) {
      where.status = filter.status;
    } else if (role === 'TARGETOLOG' || role === 'OPERATOR') {
      where.status = ProductStatus.ACTIVE;
    }

    if (role === 'TAMINOTCHI') {
      where.sellerId = context.userId;
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, context: AuthContext) {
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

    const isSupplierOwner =
      context.role === 'TAMINOTCHI' && product.sellerId === context.userId;

    if (
      product.status !== ProductStatus.ACTIVE &&
      !this.isAdminRole(context.role) &&
      !isSupplierOwner
    ) {
      throw new ForbiddenException(
        'Bu mahsulotni ko‘rish uchun ruxsatingiz yo‘q.',
      );
    }

    return product;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    context: AuthContext,
    files: ProductFilesPayload,
  ) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }

    this.ensureUpdatePermission(context, existing, dto);

    if (files.mainImage) {
      this.validateMainImage(files.mainImage);
    }
    if (files.creative) {
      this.validateCreative(files.creative);
    }

    const nextTags =
      dto.tags !== undefined
        ? this.normalizeStringArray(dto.tags)
        : existing.tags;
    const nextTraffic =
      dto.trafficSources !== undefined
        ? this.normalizeStringArray(dto.trafficSources)
        : existing.trafficSources;

    const updatedData: Prisma.ProductUpdateInput = {
      name: dto.name ? dto.name.trim() : existing.name,
      category: dto.category ? dto.category.trim() : existing.category,
      shortDescription: dto.shortDescription
        ? dto.shortDescription.trim()
        : existing.shortDescription,
      fullDescription:
        dto.fullDescription?.trim() ?? existing.fullDescription,
      price:
        dto.price !== undefined
          ? new Prisma.Decimal(dto.price)
          : existing.price,
      cpaTargetolog:
        dto.cpaTargetolog !== undefined
          ? new Prisma.Decimal(dto.cpaTargetolog)
          : existing.cpaTargetolog,
      cpaOperator:
        dto.cpaOperator !== undefined
          ? new Prisma.Decimal(dto.cpaOperator)
          : existing.cpaOperator,
      seoTitle: dto.seoTitle?.trim() ?? existing.seoTitle,
      seoDescription: dto.seoDescription?.trim() ?? existing.seoDescription,
      tags: nextTags,
      trafficSources: nextTraffic,
      marketplaceId: dto.marketplaceId?.trim() ?? existing.marketplaceId,
      externalUrl: dto.externalUrl?.trim() ?? existing.externalUrl,
    };

    if (dto.sellerId && this.isAdminRole(context.role)) {
      updatedData.seller = { connect: { id: dto.sellerId } };
    }

    const previousStatus = existing.status;
    const allowedStatus =
      dto.status !== undefined
        ? this.resolveUpdatedStatus(dto.status, context.role)
        : existing.status;
    updatedData.status = allowedStatus;

    if (files.mainImage) {
      const mainImageUrl = await this.saveMainImage(files.mainImage, existing.slug);
      await this.removeFileIfExists(existing.mainImageUrl);
      updatedData.mainImageUrl = mainImageUrl;
    }

    if (files.creative) {
      const creativeUrl = await this.saveCreativeFile(files.creative, existing.slug);
      await this.removeFileIfExists(existing.creativeUrl ?? undefined);
      updatedData.creativeUrl = creativeUrl;
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: updatedData,
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
      action: `Mahsulot yangilandi: ${product.name}`,
      meta: {
        productId: product.id,
        status: product.status,
      },
    });

    if (
      previousStatus === ProductStatus.PENDING_APPROVAL &&
      product.status === ProductStatus.ACTIVE &&
      product.seller
    ) {
      await this.notificationsService.create({
        toUserId: product.seller.id,
        message: `${product.name} mahsuloti tasdiqlandi.`,
        type: NotificationType.SYSTEM,
        metadata: {
          productId: product.id,
        },
      });
    }

    return {
      message: 'Mahsulot yangilandi.',
      product,
    };
  }

  async archive(id: string, context: AuthContext) {
    if (!this.isAdminRole(context.role)) {
      throw new ForbiddenException(
        'Mahsulotlarni arxivlash uchun ruxsatingiz yo‘q.',
      );
    }

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

  private ensureCreatePermission(role: string) {
    if (!this.isAdminRole(role) && role !== 'TAMINOTCHI') {
      throw new ForbiddenException(
        'Mahsulot qo‘shish uchun ruxsatingiz yo‘q.',
      );
    }
  }

  private ensureUpdatePermission(
    context: AuthContext,
    existing: { sellerId: string },
    dto: UpdateProductDto,
  ) {
    if (this.isAdminRole(context.role)) {
      return;
    }
    if (context.role === 'TAMINOTCHI') {
      if (existing.sellerId !== context.userId) {
        throw new ForbiddenException(
          'Bu mahsulotni tahrirlash uchun ruxsatingiz yo‘q.',
        );
      }
      if (dto.sellerId && dto.sellerId !== existing.sellerId) {
        throw new ForbiddenException('Sotuvchi ID sini o‘zgartira olmaysiz.');
      }
      if (dto.status !== undefined) {
        throw new ForbiddenException(
          'Mahsulot holatini o‘zgartirishga ruxsatingiz yo‘q.',
        );
      }
      return;
    }
    throw new ForbiddenException(
      'Mahsulotni yangilash uchun ruxsatingiz yo‘q.',
    );
  }

  private isAdminRole(role: string) {
    return ['ADMIN', 'SUPER_ADMIN', 'SKLAD_ADMIN'].includes(role);
  }

  private normalizeStringArray(values?: string[] | null) {
    if (!values) {
      return [];
    }
    const unique = new Set<string>();
    values.forEach((value) => {
      const trimmed = value.trim();
      if (trimmed) {
        unique.add(trimmed);
      }
    });
    return Array.from(unique);
  }

  private resolveSellerId(
    sellerIdFromDto: string | undefined,
    context: AuthContext,
  ) {
    if (this.isAdminRole(context.role) && sellerIdFromDto) {
      return sellerIdFromDto;
    }
    if (context.userId) {
      return context.userId;
    }
    throw new BadRequestException(
      'Sotuvchi aniqlanmadi. Iltimos, qayta urinib ko‘ring.',
    );
  }

  private resolveInitialStatus(
    requested: ProductStatus | undefined,
    role: string,
  ) {
    if (this.isAdminRole(role)) {
      return requested ?? ProductStatus.ACTIVE;
    }
    return ProductStatus.PENDING_APPROVAL;
  }

  private resolveUpdatedStatus(status: ProductStatus, role: string) {
    if (!this.isAdminRole(role)) {
      return status;
    }
    return status;
  }

  private async generateUniqueSlug(name: string) {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
    let slug = base || `mahsulot-${Date.now()}`;
    let attempt = 1;

    // ensure uniqueness
    while (
      await this.prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      })
    ) {
      slug = `${base}-${attempt++}`;
    }
    return slug;
  }

  private buildSmartLink(slug: string) {
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ??
      'http://localhost:3000';
    return `${frontendUrl.replace(/\/$/, '')}/landing/${slug}`;
  }

  private validateMainImage(file: Express.Multer.File) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Asosiy rasm formati noto‘g‘ri. Faqat JPG, PNG yoki WebP ruxsat etiladi.',
      );
    }
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Asosiy rasm hajmi 2MB dan oshmasligi kerak.',
      );
    }
  }

  private validateCreative(file: Express.Multer.File) {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed',
      'video/mp4',
    ];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Kreativ fayl formati noto‘g‘ri. Rasm, ZIP yoki MP4 yuklang.',
      );
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Kreativ fayl hajmi 10MB dan oshmasligi kerak.',
      );
    }
  }

  private resolveImageExtension(mimetype: string) {
    if (mimetype === 'image/png') {
      return '.png';
    }
    if (mimetype === 'image/webp') {
      return '.webp';
    }
    return '.jpg';
  }

  private resolveCreativeExtension(file: Express.Multer.File) {
    const originalExt = path.extname(file.originalname);
    if (originalExt) {
      return originalExt.toLowerCase();
    }
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      return '.zip';
    }
    if (file.mimetype === 'video/mp4') {
      return '.mp4';
    }
    if (file.mimetype === 'image/png') {
      return '.png';
    }
    if (file.mimetype === 'image/webp') {
      return '.webp';
    }
    return '.jpg';
  }

  private async saveMainImage(file: Express.Multer.File, slug: string) {
    await fs.mkdir(this.uploadsRoot, { recursive: true });
    const filename = `${slug}-main.webp`;
    const outputPath = path.join(this.uploadsRoot, filename);

    await sharp(file.buffer)
      .resize({
        width: 1280,
        withoutEnlargement: true,
      })
      .toFormat('webp', { quality: 80 })
      .toFile(outputPath);

    return `/uploads/products/${filename}`;
  }

  private async saveCreativeFile(
    file: Express.Multer.File,
    slug: string,
  ): Promise<string> {
    await fs.mkdir(this.uploadsRoot, { recursive: true });
    const extension = this.resolveCreativeExtension(file);
    const filename = `${slug}-creative-${randomUUID().slice(0, 8)}${extension}`;
    const outputPath = path.join(this.uploadsRoot, filename);
    await fs.writeFile(outputPath, file.buffer);
    return `/uploads/products/${filename}`;
  }

  private async removeFileIfExists(url?: string) {
    if (!url) {
      return;
    }
    const relativePath = url.startsWith('/uploads/')
      ? url.replace('/uploads/', '')
      : null;
    if (!relativePath) {
      return;
    }
    const absolutePath = path.join(process.cwd(), 'uploads', relativePath);
    try {
      await fs.unlink(absolutePath);
    } catch {
      // ignore missing files
    }
  }

  private async notifyAdminsOnPendingProduct(
    productId: string,
    productName: string,
    sellerId: string,
  ) {
    const admins = await this.prisma.user.findMany({
      where: {
        role: {
          slug: {
            in: ['ADMIN', 'SUPER_ADMIN', 'SKLAD_ADMIN'],
          },
        },
      },
      select: { id: true },
    });
    const adminIds = admins.map((admin) => admin.id);
    if (adminIds.length === 0) {
      return;
    }

    await this.notificationsService.notifyMany(
      adminIds,
      `Yangi mahsulot tasdiqlashda: ${productName}`,
      NotificationType.SYSTEM,
      {
        productId,
        sellerId,
      },
    );
  }
}
