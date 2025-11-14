import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FlowStatus,
  LeadStatus,
  NotificationType,
  OrderStatus,
  Prisma,
  ProductStatus,
} from '@prisma/client';

import { ActivityService } from '@/activity/activity.service';
import { BalanceService } from '@/balance/balance.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadNoteDto } from './dto/update-lead-status.dto';

type PublicLeadContext = {
  ip?: string | null;
  userAgent?: string | null;
};

type OperatorContext = {
  userId: string;
  role: string;
};

const LEAD_RELATIONS = {
  product: {
    select: {
      id: true,
      title: true,
      price: true,
      cpaTargetolog: true,
      cpaOperator: true,
    },
  },
  flow: {
    select: {
      id: true,
      title: true,
      slug: true,
    },
  },
  operator: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nickname: true,
    },
  },
} as const;

type LeadWithRelations = Prisma.LeadGetPayload<{
  include: typeof LEAD_RELATIONS;
}>;

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
    private readonly balanceService: BalanceService,
  ) {}

  async createPublicLead(dto: CreateLeadDto, context: PublicLeadContext) {
    const slug = dto.flowSlug.trim().toLowerCase();
    const flow = await this.prisma.flow.findUnique({
      where: { slug },
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

    if (!flow || flow.status !== FlowStatus.ACTIVE) {
      throw new NotFoundException('Oqim topilmadi yoki faol emas.');
    }

    if (!flow.product || flow.product.status !== ProductStatus.APPROVED) {
      throw new BadRequestException('Mahsulot hozirda qabul qilinmaydi.');
    }

    const phone = this.normalizePhone(dto.phone);
    if (!phone) {
      throw new BadRequestException('Telefon raqami noto‘g‘ri.');
    }

    const lead = await this.prisma.lead.create({
      data: {
        flowId: flow.id,
        productId: flow.productId,
        targetologId: flow.ownerId,
        phone,
        name: dto.name?.trim() || null,
        notes: dto.notes?.trim() || null,
        status: LeadStatus.NEW,
        sourceIp: context.ip ?? null,
        userAgent: context.userAgent ?? null,
      },
      include: this.leadRelations(),
    });

    await this.prisma.flow.update({
      where: { id: flow.id },
      data: {
        leads: { increment: 1 },
      },
    });

    await this.activityService.log({
      userId: flow.ownerId,
      action: 'Yangi lead qabul qilindi.',
      ip: context.ip ?? undefined,
      device: context.userAgent ?? undefined,
      meta: {
        leadId: lead.id,
        flowId: flow.id,
      },
    });

    await this.notificationsService.create({
      toUserId: flow.ownerId,
      message: `Yangi lead kelib tushdi: ${lead.phone}`,
      type: NotificationType.LEAD,
      metadata: {
        leadId: lead.id,
        flowId: flow.id,
      },
    });

    return {
      message: 'Lead qabul qilindi.',
      lead: this.mapLeadResponse(lead),
    };
  }

  async getOperatorQueue(context: OperatorContext) {
    this.ensureOperatorContext(context);

    const leads = await this.prisma.lead.findMany({
      where: {
        OR: [
          { status: LeadStatus.NEW },
          {
            status: { in: [LeadStatus.ASSIGNED, LeadStatus.CALLBACK] },
            operatorId: context.userId,
          },
        ],
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      include: this.leadRelations(),
    });

    return leads.map((lead) => this.mapLeadResponse(lead));
  }

  async assignLead(id: string, context: OperatorContext) {
    this.ensureOperatorContext(context);

    const updated = await this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          operatorId: true,
        },
      });
      if (!lead) {
        throw new NotFoundException('Lead topilmadi.');
      }
      if (
        lead.status !== LeadStatus.NEW &&
        !(lead.status === LeadStatus.ASSIGNED && lead.operatorId === context.userId)
      ) {
        throw new BadRequestException('Lead allaqachon boshqa operatorga biriktirilgan.');
      }

      return tx.lead.update({
        where: { id },
        data: {
          operatorId: context.userId,
          status: LeadStatus.ASSIGNED,
        },
        include: this.leadRelations(),
      });
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Lead operatorga biriktirildi.',
      meta: { leadId: updated.id },
    });

    return this.mapLeadResponse(updated);
  }

  async markCallback(id: string, dto: LeadNoteDto, context: OperatorContext) {
    const lead = await this.getLeadForOperator(id, context.userId);

    if (lead.status !== LeadStatus.ASSIGNED && lead.status !== LeadStatus.CALLBACK) {
      throw new BadRequestException('Lead qayta aloqa navbatiga o‘tkazib bo‘lmaydi.');
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        status: LeadStatus.CALLBACK,
        notes: dto.note?.trim() ?? lead.notes,
      },
      include: this.leadRelations(),
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Lead qayta aloqa sifatida belgilandi.',
      meta: { leadId: id },
    });

    return this.mapLeadResponse(updated);
  }

  async cancelLead(id: string, dto: LeadNoteDto, context: OperatorContext) {
    const lead = await this.getLeadForOperator(id, context.userId);

    if (lead.status === LeadStatus.CANCELLED) {
      return this.mapLeadResponse(lead);
    }
    if (lead.status === LeadStatus.CONFIRMED) {
      throw new BadRequestException('Tasdiqlangan leadni bekor qilib bo‘lmaydi.');
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        status: LeadStatus.CANCELLED,
        notes: dto.note?.trim() ?? lead.notes,
      },
      include: this.leadRelations(),
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Lead bekor qilindi.',
      meta: { leadId: id },
    });

    await this.notificationsService.create({
      toUserId: updated.targetologId,
      message: 'Lead bekor qilindi.',
      type: NotificationType.LEAD,
      metadata: {
        leadId: updated.id,
        flowId: updated.flowId,
      },
    });

    return this.mapLeadResponse(updated);
  }

  async confirmLead(id: string, dto: LeadNoteDto, context: OperatorContext) {
    const result = await this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              cpaTargetolog: true,
              cpaOperator: true,
            },
          },
          flow: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          operator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nickname: true,
            },
          },
        },
      });

      if (!lead) {
        throw new NotFoundException('Lead topilmadi.');
      }
      if (lead.operatorId !== context.userId) {
        throw new ForbiddenException('Lead boshqa operatorga biriktirilgan.');
      }
      if (
        lead.status !== LeadStatus.ASSIGNED &&
        lead.status !== LeadStatus.CALLBACK
      ) {
        if (lead.status === LeadStatus.CONFIRMED) {
          throw new BadRequestException('Lead allaqachon tasdiqlangan.');
        }
        throw new BadRequestException('Leadni tasdiqlash uchun avval biriktiring.');
      }

      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: LeadStatus.CONFIRMED,
          notes: dto.note?.trim() ?? lead.notes,
        },
        include: this.leadRelations(),
      });

      const orderAmount =
        lead.product?.price instanceof Prisma.Decimal
          ? lead.product.price
          : new Prisma.Decimal(lead.product?.price ?? 0);

      const order = await tx.order.create({
        data: {
          productId: lead.productId,
          targetologId: lead.targetologId,
          operatorId: context.userId,
          leadId: lead.id,
          status: OrderStatus.PACKING,
          amount: orderAmount,
        },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              cpaTargetolog: true,
              cpaOperator: true,
            },
          },
        },
      });

      if (lead.product?.cpaTargetolog) {
        const targetReward = new Prisma.Decimal(lead.product.cpaTargetolog);
        if (targetReward.gt(0)) {
          await this.balanceService.addHoldBalance(
            lead.targetologId,
            targetReward,
            {
              leadId: lead.id,
              orderId: order.id,
              flowId: lead.flowId,
              role: 'TARGETOLOG',
            },
            tx,
          );
        }
      }

      if (lead.product?.cpaOperator && lead.operatorId) {
        const operatorReward = new Prisma.Decimal(lead.product.cpaOperator);
        if (operatorReward.gt(0)) {
          await this.balanceService.addHoldBalance(
            lead.operatorId,
            operatorReward,
            {
              leadId: lead.id,
              orderId: order.id,
              flowId: lead.flowId,
              role: 'OPERATOR',
            },
            tx,
          );
        }
      }

      await tx.flow.update({
        where: { id: lead.flowId },
        data: {
          orders: { increment: 1 },
        },
      });

      return { updatedLead, leadSnapshot: lead, order };
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Lead tasdiqlanib buyurtmaga aylantirildi.',
      meta: {
        leadId: result.updatedLead.id,
        orderId: result.order.id,
      },
    });

    await this.notificationsService.create({
      toUserId: result.updatedLead.targetologId,
      message: 'Lead tasdiqlandi va buyurtma yaratildi.',
      type: NotificationType.ORDER,
      metadata: {
        leadId: result.updatedLead.id,
        orderId: result.order.id,
      },
    });

    return {
      lead: this.mapLeadResponse(result.updatedLead),
      order: {
        id: result.order.id,
        amount: result.order.amount.toString(),
        status: result.order.status,
        product: result.order.product,
      },
    };
  }

  private async getLeadForOperator(id: string, operatorId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: this.leadRelations(),
    });
    if (!lead) {
      throw new NotFoundException('Lead topilmadi.');
    }
    if (lead.operatorId !== operatorId) {
      throw new ForbiddenException('Lead sizga biriktirilmagan.');
    }
    return lead;
  }

  private leadRelations() {
    return LEAD_RELATIONS;
  }

  private mapLeadResponse(lead: LeadWithRelations) {
    if (!lead) {
      return null;
    }

    return {
      id: lead.id,
      status: lead.status,
      phone: lead.phone,
      name: lead.name,
      notes: lead.notes,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      targetologId: lead.targetologId,
      operatorId: lead.operatorId,
      flow: lead.flow
        ? {
            id: lead.flow.id,
            title: lead.flow.title,
            slug: lead.flow.slug,
          }
        : null,
      product: lead.product
        ? {
            id: lead.product.id,
            title: lead.product.title,
            price: lead.product.price?.toString?.() ?? null,
            cpaTargetolog: lead.product.cpaTargetolog?.toString?.() ?? null,
            cpaOperator: lead.product.cpaOperator?.toString?.() ?? null,
          }
        : null,
      operator: lead.operator
        ? {
            id: lead.operator.id,
            firstName: lead.operator.firstName,
            lastName: lead.operator.lastName,
            nickname: lead.operator.nickname,
          }
        : null,
    };
  }

  private normalizePhone(phone: string) {
    const digits = phone.replace(/[^\d+]/g, '');
    const cleaned = digits.startsWith('+') ? `+${digits.slice(1).replace(/\D/g, '')}` : digits.replace(/\D/g, '');
    if (cleaned.length < 7) {
      return null;
    }
    return cleaned;
  }

  private ensureOperatorContext(context: OperatorContext) {
    if (!['OPERATOR', 'OPER_ADMIN'].includes(context.role)) {
      throw new ForbiddenException('Bu amal faqat operatorlar uchun.');
    }
  }
}
