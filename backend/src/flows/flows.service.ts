import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FlowStatus, Prisma, ProductStatus } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateFlowDto } from './dto/create-flow.dto';

type AuthContext = {
  userId: string;
  role: string;
};

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'SKLAD_ADMIN']);

@Injectable()
export class FlowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateFlowDto, context: AuthContext) {
    this.assertRole(context.role, ['TARGETOLOG']);

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    if (!product || product.status !== ProductStatus.APPROVED) {
      throw new ForbiddenException('Faqat tasdiqlangan mahsulotlar uchun oqim yaratish mumkin.');
    }

    const title = (dto.title ?? product.title ?? 'Oqim').trim();
    const desiredSlug = dto.slug ? this.normalizeSlug(dto.slug) : this.slugify(title);
    const slug = await this.generateUniqueSlug(desiredSlug, Boolean(dto.slug));
    const destinationUrl = this.buildProductUrl(product.id, slug);

    const flow = await this.prisma.flow.create({
      data: {
        title,
        productId: product.id,
        ownerId: context.userId,
        slug,
        url: destinationUrl,
        status: FlowStatus.ACTIVE,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return this.toFlowResponse(flow);
  }

  async findMine(context: AuthContext) {
    this.assertRole(context.role, ['TARGETOLOG']);

    const flows = await this.prisma.flow.findMany({
      where: { ownerId: context.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return flows.map((flow) => this.toFlowResponse(flow));
  }

  async pauseFlow(id: string, context: AuthContext) {
    this.assertRole(context.role, ['TARGETOLOG']);
    const flow = await this.ensureOwnedFlow(id, context.userId);

    if (flow.status === FlowStatus.PAUSED) {
      return this.toFlowResponse(flow);
    }

    const updated = await this.prisma.flow.update({
      where: { id: flow.id },
      data: { status: FlowStatus.PAUSED },
      include: {
        product: { select: { id: true, title: true, status: true } },
      },
    });

    return this.toFlowResponse(updated);
  }

  async activateFlow(id: string, context: AuthContext) {
    this.assertRole(context.role, ['TARGETOLOG']);
    const flow = await this.ensureOwnedFlow(id, context.userId);

    if (flow.status === FlowStatus.ACTIVE) {
      return this.toFlowResponse(flow);
    }

    const updated = await this.prisma.flow.update({
      where: { id: flow.id },
      data: { status: FlowStatus.ACTIVE },
      include: {
        product: { select: { id: true, title: true, status: true } },
      },
    });

    return this.toFlowResponse(updated);
  }

  async trackClick(slug: string) {
    const flow = await this.prisma.flow.findUnique({
      where: { slug },
    });

    if (!flow || flow.status !== FlowStatus.ACTIVE) {
      throw new NotFoundException('Oqim topilmadi yoki faol emas.');
    }

    await this.prisma.flow.update({
      where: { id: flow.id },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });

    return flow.url;
  }

  async findByProduct(productId: string, context: AuthContext) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        ownerId: true,
        status: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }

    const where: Prisma.FlowWhereInput = {
      productId,
    };

    if (ADMIN_ROLES.has(context.role)) {
      // admins see all flows
    } else if (context.role === 'TAMINOTCHI') {
      if (product.ownerId !== context.userId) {
        throw new ForbiddenException('Ushbu mahsulot oqimlarini ko‘rish uchun ruxsat yo‘q.');
      }
    } else if (context.role === 'TARGETOLOG') {
      if (product.status !== ProductStatus.APPROVED) {
        throw new ForbiddenException('Faqat tasdiqlangan mahsulot oqimlari ko‘rinadi.');
      }
      where.ownerId = context.userId;
    } else {
      throw new ForbiddenException('Oqimlarni ko‘rish uchun ruxsat yo‘q.');
    }

    const flows = await this.prisma.flow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nickname: true,
          },
        },
      },
    });

    return flows.map((flow) => this.toFlowResponse(flow));
  }

  async remove(id: string, context: AuthContext) {
    const flow = await this.prisma.flow.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
        product: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!flow) {
      throw new NotFoundException('Oqim topilmadi.');
    }

    if (ADMIN_ROLES.has(context.role)) {
      await this.prisma.flow.delete({ where: { id } });
      return { message: 'Oqim o‘chirildi.' };
    }

    if (context.role === 'TARGETOLOG') {
      if (flow.ownerId !== context.userId) {
        throw new ForbiddenException('Faqat o‘zingizga tegishli oqimlarni o‘chira olasiz.');
      }
      await this.prisma.flow.delete({ where: { id } });
      return { message: 'Oqim o‘chirildi.' };
    }

    if (context.role === 'TAMINOTCHI') {
      if (flow.product.ownerId !== context.userId) {
        throw new ForbiddenException('Ushbu oqimni o‘chirish huquqiga ega emassiz.');
      }
      await this.prisma.flow.delete({ where: { id } });
      return { message: 'Oqim o‘chirildi.' };
    }

    throw new ForbiddenException('Oqimni o‘chirish uchun ruxsat yo‘q.');
  }

  private assertRole(role: string, allowed: string[]) {
    if (!allowed.includes(role)) {
      throw new ForbiddenException('Bu amalni bajarish uchun ruxsat yo‘q.');
    }
  }

  private async ensureOwnedFlow(id: string, ownerId: string) {
    const flow = await this.prisma.flow.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, title: true, status: true } },
      },
    });

    if (!flow) {
      throw new NotFoundException('Oqim topilmadi.');
    }
    if (flow.ownerId !== ownerId) {
      throw new ForbiddenException('Faqat o‘zingizga tegishli oqimlarni boshqarishingiz mumkin.');
    }

    return flow;
  }

  private async generateUniqueSlug(baseSlug: string, strict = false) {
    const fallback = baseSlug || `oqim-${Math.random().toString(36).slice(2, 8)}`;
    let attempt = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const candidate =
        attempt === 0
          ? fallback
          : `${fallback}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 32);
      const existing = await this.prisma.flow.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
      if (strict) {
        throw new ForbiddenException('Tanlangan slug allaqachon band.');
      }
      attempt += 1;
    }
  }

  private normalizeSlug(value: string) {
    const normalized = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);

    if (!normalized) {
      throw new ForbiddenException('Slug noto‘g‘ri.');
    }

    return normalized;
  }

  private slugify(value: string) {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);

    return slug || `oqim-${Math.random().toString(36).slice(2, 8)}`;
  }

  private buildProductUrl(productId: string, slug: string) {
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ?? 'http://localhost:3000';
    const base = frontendUrl.replace(/\/$/, '');
    return `${base}/products/${productId}?flow=${slug}`;
  }

  private toFlowResponse(flow: {
    id: string;
    title: string;
    slug: string;
    url: string;
    clicks: number;
    leads: number;
    orders: number;
    status: FlowStatus;
    productId: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    product?: {
      id: string;
      title: string;
      status?: ProductStatus;
    } | null;
  }) {
    const publicBase =
      this.configService.get<string>('app.publicUrl') ?? 'http://localhost:3001';
    const trackingUrl = `${publicBase.replace(/\/$/, '')}/f/${flow.slug}`;

    return {
      id: flow.id,
      title: flow.title,
      slug: flow.slug,
      url: flow.url,
      trackingUrl,
      clicks: flow.clicks,
      leads: flow.leads,
      orders: flow.orders,
      status: flow.status,
      productId: flow.productId,
      ownerId: flow.ownerId,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
      product: flow.product
        ? {
            id: flow.product.id,
            title: flow.product.title,
            status: flow.product.status,
          }
        : null,
    };
  }
}
