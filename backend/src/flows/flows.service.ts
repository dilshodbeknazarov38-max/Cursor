import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateFlowDto } from './dto/create-flow.dto';

type AuthContext = {
  userId: string;
  role: string;
};

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'SKLAD_ADMIN']);

@Injectable()
export class FlowsService {
  constructor(private readonly prisma: PrismaService) {}

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

    const flow = await this.prisma.flow.create({
      data: {
        title: dto.title.trim(),
        productId: product.id,
        ownerId: context.userId,
        urlSlug: await this.generateUniqueSlug(dto.title),
      },
    });

    return flow;
  }

  async findMine(context: AuthContext) {
    this.assertRole(context.role, ['TARGETOLOG']);

    return this.prisma.flow.findMany({
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

    return this.prisma.flow.findMany({
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

  private async generateUniqueSlug(title: string) {
    const baseSlug = this.slugify(title) || 'oqim';
    let attempt = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const candidate =
        attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      const existing = await this.prisma.flow.findUnique({
        where: { urlSlug: candidate },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
      attempt += 1;
    }
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }
}
