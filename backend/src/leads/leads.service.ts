import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LeadStatus,
  NotificationType,
  Prisma,
  ProductStatus,
} from '@prisma/client';

import { ActivityService } from '@/activity/activity.service';
import { BalanceService } from '@/balance/balance.service';
import { BalancesService } from '@/balances/balances.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';

type AuthContext = {
  userId: string;
  role: string;
  ip?: string | null;
  device?: string | null;
};

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
    private readonly balancesService: BalancesService,
    private readonly balanceService: BalanceService,
  ) {}

  async create(dto: CreateLeadDto, context: AuthContext) {
    this.ensureCreatePermission(context.role, dto.targetologId);

    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        status: ProductStatus.APPROVED,
      },
    });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi yoki faol emas.');
    }

    const targetologId =
      dto.targetologId && this.canAssignTargetolog(context.role)
        ? dto.targetologId
        : context.userId;

    if (!targetologId) {
      throw new ForbiddenException('Targetolog aniqlanmadi.');
    }

    const lead = await this.prisma.lead.create({
      data: {
        productId: product.id,
        targetologId,
        notes: dto.notes,
      },
      include: {
        product: true,
      },
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Yangi lead yaratildi.',
      ip: context.ip,
      device: context.device,
      meta: {
        leadId: lead.id,
        productId: lead.productId,
        targetologId: lead.targetologId,
      },
    });

    await this.balancesService.evaluateLeadIpAbuse(
      targetologId,
      context.ip ?? null,
    );
      await this.notifyTargetAdmin(
        `Yangi lead yaratildi: ${lead.product.title}`,
        lead.targetologId,
      );

    return {
      message: 'Lead muvaffaqiyatli yaratildi.',
      lead,
    };
  }

  async findAll(
    context: AuthContext,
    filter?: { status?: LeadStatus; productId?: string },
  ) {
    const where: Prisma.LeadWhereInput = {};

    if (!this.canSeeAllLeads(context.role)) {
      where.targetologId = context.userId;
    }

    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.productId) {
      where.productId = filter.productId;
    }

    return this.prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
      },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateLeadStatusDto,
    context: AuthContext,
  ) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });
    if (!lead) {
      throw new NotFoundException('Lead topilmadi.');
    }

      if (!this.canUpdateStatus(context, lead)) {
        throw new ForbiddenException(
          'Lead statusini o‘zgartirish uchun ruxsatingiz yo‘q.',
        );
      }

      const previousStatus = lead.status;

      const updated = await this.prisma.lead.update({
        where: { id },
        data: { status: dto.status },
      });

      const holdAmount =
        lead.product?.cpaTargetolog !== null && lead.product?.cpaTargetolog !== undefined
          ? new Prisma.Decimal(lead.product.cpaTargetolog)
          : null;

      if (
        dto.status === LeadStatus.TASDIQLANGAN &&
        previousStatus !== LeadStatus.TASDIQLANGAN &&
        holdAmount &&
        holdAmount.gt(0)
      ) {
        await this.balanceService.addHoldBalance(updated.targetologId, holdAmount, {
          leadId: id,
          productId: lead.product.id,
        });
      } else if (
        dto.status === LeadStatus.RAD_ETILGAN &&
        previousStatus === LeadStatus.TASDIQLANGAN &&
        holdAmount &&
        holdAmount.gt(0)
      ) {
        const currentBalance = await this.balanceService.ensureUserBalance(updated.targetologId);
        const currentHold = new Prisma.Decimal(currentBalance.holdBalance ?? 0);
        if (currentHold.gte(holdAmount)) {
          await this.balanceService.removeHold(updated.targetologId, holdAmount, {
            leadId: id,
            productId: lead.product.id,
            reason: 'LEAD_REJECTED',
          });
        }
      }

      await this.activityService.log({
        userId: context.userId,
        action: `Lead statusi yangilandi: ${dto.status}`,
        meta: {
          leadId: id,
          status: dto.status,
        },
      });

      await this.notificationsService.create({
        toUserId: updated.targetologId,
        message: `Sizning lead statusingiz yangilandi: ${dto.status}`,
        type: NotificationType.LEAD,
        metadata: {
          leadId: updated.id,
          productId: updated.productId,
        },
      });

    return {
      message: 'Lead statusi yangilandi.',
      lead: updated,
    };
  }

  private ensureCreatePermission(role: string, targetologId?: string) {
    if (role === 'TARGETOLOG' && targetologId && targetologId !== '') {
      throw new ForbiddenException(
        'Lead yaratishda boshqa targetologni tanlashga ruxsat berilmagan.',
      );
    }

    if (!['TARGETOLOG', 'ADMIN', 'TARGET_ADMIN'].includes(role)) {
      throw new ForbiddenException('Lead yaratish uchun ruxsatingiz yo‘q.');
    }
  }

  private canAssignTargetolog(role: string) {
    return ['ADMIN', 'TARGET_ADMIN'].includes(role);
  }

  private canSeeAllLeads(role: string) {
    return ['ADMIN', 'TARGET_ADMIN', 'OPER_ADMIN', 'SUPER_ADMIN'].includes(role);
  }

  private canUpdateStatus(
    context: AuthContext,
    lead: { targetologId: string },
  ) {
    if (context.userId === lead.targetologId) {
      return true;
    }
    return ['ADMIN', 'TARGET_ADMIN', 'OPER_ADMIN'].includes(context.role);
  }

  private async notifyTargetAdmin(message: string, targetologId: string) {
    const admins = await this.prisma.user.findMany({
      where: {
        role: {
          slug: 'TARGET_ADMIN',
        },
      },
      select: { id: true },
    });
    const adminIds = admins.map((admin) => admin.id);

    if (adminIds.length > 0) {
      await this.notificationsService.notifyMany(
        adminIds,
        message,
        NotificationType.LEAD,
        {
          targetologId,
        },
      );
    }
  }
}
