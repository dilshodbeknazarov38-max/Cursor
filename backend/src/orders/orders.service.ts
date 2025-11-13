import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
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

import { AssignOperatorDto } from './dto/assign-operator.dto';
import { CreateOrderDto } from './dto/create-order.dto';

type AuthContext = {
  userId: string;
  role: string;
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
    private readonly balanceService: BalanceService,
  ) {}

  async create(dto: CreateOrderDto, context: AuthContext) {
    this.ensureCreatePermission(context.role);

    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        status: ProductStatus.APPROVED,
      },
    });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }

    const targetolog = await this.prisma.user.findFirst({
      where: {
        id: dto.targetologId,
        role: { slug: 'TARGETOLOG' },
      },
    });
    if (!targetolog) {
      throw new NotFoundException('Targetolog topilmadi.');
    }

    let lead = null;
    if (dto.leadId) {
      lead = await this.prisma.lead.findFirst({
        where: { id: dto.leadId },
      });
      if (!lead) {
        throw new NotFoundException('Lead topilmadi.');
      }
      if (lead.targetologId !== targetolog.id) {
        throw new ForbiddenException(
          'Lead ko‘rsatilgan targetologga tegishli emas.',
        );
      }
    }

    let operator = null;
    if (dto.operatorId) {
      operator = await this.prisma.user.findFirst({
        where: { id: dto.operatorId, role: { slug: 'OPERATOR' } },
      });
      if (!operator) {
        throw new NotFoundException('Operator topilmadi.');
      }
    }

    const order = await this.prisma.order.create({
      data: {
        productId: product.id,
        targetologId: targetolog.id,
        operatorId: operator?.id,
        leadId: lead?.id ?? null,
        status: OrderStatus.PACKING,
        amount: new Prisma.Decimal(dto.amount),
      },
      include: this.orderRelations(),
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Yangi buyurtma yaratildi.',
      meta: {
        orderId: order.id,
        status: order.status,
      },
    });

    await this.notificationsService.create({
      toUserId: order.targetologId,
      message: `Mahsulot bo‘yicha yangi buyurtma yaratildi: ${order.product.title}`,
      type: NotificationType.ORDER,
      metadata: { orderId: order.id },
    });

    if (order.operatorId) {
      await this.notificationsService.create({
        toUserId: order.operatorId,
        message: `Sizga yangi buyurtma biriktirildi.`,
        type: NotificationType.ORDER,
        metadata: { orderId: order.id },
      });
    }

    return {
      message: 'Buyurtma muvaffaqiyatli yaratildi.',
      order,
    };
  }

  async findAll(
    context: AuthContext,
    filter?: { status?: OrderStatus; productId?: string },
  ) {
    const where: Prisma.OrderWhereInput = {};

    switch (context.role) {
      case 'TARGETOLOG':
        where.targetologId = context.userId;
        break;
      case 'OPERATOR':
        where.operatorId = context.userId;
        break;
      case 'TAMINOTCHI':
        where.product = {
          ownerId: context.userId,
        };
        break;
      case 'SKLAD_ADMIN':
        break;
      default:
        break;
    }

    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.productId) {
      where.productId = filter.productId;
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: this.orderRelations(true),
    });
  }

  async assignOperator(id: string, dto: AssignOperatorDto, context: AuthContext) {
    this.ensureAssignPermission(context.role);

    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }
    if (order.status === OrderStatus.RETURNED) {
      throw new BadRequestException('Qaytarilgan buyurtmaga operator biriktirib bo‘lmaydi.');
    }

    const operator = await this.prisma.user.findFirst({
      where: { id: dto.operatorId, role: { slug: 'OPERATOR' } },
    });
    if (!operator) {
      throw new NotFoundException('Operator topilmadi.');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        operatorId: operator.id,
      },
      include: this.orderRelations(),
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Buyurtma operatorga biriktirildi.',
      meta: {
        orderId: id,
        operatorId: operator.id,
      },
    });

    await this.notificationsService.create({
      toUserId: operator.id,
      message: `Sizga yangi buyurtma biriktirildi: ${updated.product.title}`,
      type: NotificationType.ORDER,
      metadata: {
        orderId: updated.id,
      },
    });

    await this.notificationsService.create({
      toUserId: updated.targetologId,
      message: `Buyurtmangiz operatorga biriktirildi.`,
      type: NotificationType.ORDER,
      metadata: {
        orderId: updated.id,
      },
    });

    return {
      message: 'Operator muvaffaqiyatli tayinlandi.',
      order: updated,
    };
  }

  async packOrder(id: string, context: AuthContext) {
    this.ensureSkladPermission(context.role);

    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }
    if (order.status !== OrderStatus.PACKING) {
      throw new BadRequestException('Buyurtma qadoqlash holatida emas.');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        packedAt: order.packedAt ?? new Date(),
      },
      include: this.orderRelations(),
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Buyurtma qadoqlanishi tasdiqlandi.',
      meta: { orderId: updated.id },
    });

    return {
      message: 'Buyurtma qadoqlandi.',
      order: updated,
    };
  }

  async shipOrder(id: string, context: AuthContext) {
    this.ensureSkladPermission(context.role);

    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }
    if (order.status !== OrderStatus.PACKING) {
      throw new BadRequestException('Buyurtma jo‘natish uchun tayyor emas.');
    }

    const shipTime = new Date();

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.SHIPPED,
        packedAt: order.packedAt ?? shipTime,
        shippedAt: shipTime,
      },
      include: this.orderRelations(),
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Buyurtma jo‘natildi.',
      meta: { orderId: updated.id },
    });

    await this.notifyTargetAndOperator(updated, 'Buyurtma jo‘natildi.');

    return {
      message: 'Buyurtma jo‘natildi.',
      order: updated,
    };
  }

  async deliverOrder(id: string, context: AuthContext) {
    this.ensureSkladPermission(context.role);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
        lead: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }
    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('Buyurtma yetkazib berish holatida emas.');
    }

    const targetReward = order.product?.cpaTargetolog
      ? new Prisma.Decimal(order.product.cpaTargetolog)
      : null;
    const operatorReward =
      order.product?.cpaOperator && order.operatorId
        ? new Prisma.Decimal(order.product.cpaOperator)
        : null;

    const deliveredAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt,
        },
      });

      if (order.leadId && order.lead?.status !== LeadStatus.CONFIRMED) {
        await tx.lead.update({
          where: { id: order.leadId },
          data: { status: LeadStatus.CONFIRMED },
        });
      }

      if (targetReward && targetReward.gt(0)) {
        await this.balanceService.releaseHoldToMain(
          order.targetologId,
          targetReward,
          {
            orderId: id,
            leadId: order.leadId,
          },
          tx,
        );
      }

      if (operatorReward && operatorReward.gt(0) && order.operatorId) {
        await this.balanceService.releaseHoldToMain(
          order.operatorId,
          operatorReward,
          {
            orderId: id,
            leadId: order.leadId,
            role: 'OPERATOR',
          },
          tx,
        );
      }
    });

    const updated = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderRelations(),
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Buyurtma yetkazildi.',
      meta: { orderId: id },
    });

    await this.notifyTargetAndOperator(updated!, 'Buyurtma yetkazib berildi.');

    return {
      message: 'Buyurtma muvaffaqiyatli yetkazildi.',
      order: updated,
    };
  }

  async returnOrder(id: string, context: AuthContext) {
    this.ensureSkladPermission(context.role);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
        lead: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }
    if (
      order.status !== OrderStatus.PACKING &&
      order.status !== OrderStatus.SHIPPED
    ) {
      throw new BadRequestException(
        'Buyurtmani qaytarish faqat qadoqlash yoki jo‘natish bosqichida mumkin.',
      );
    }

    const targetReward = order.product?.cpaTargetolog
      ? new Prisma.Decimal(order.product.cpaTargetolog)
      : null;
    const operatorReward =
      order.product?.cpaOperator && order.operatorId
        ? new Prisma.Decimal(order.product.cpaOperator)
        : null;

    const returnedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.RETURNED,
          returnedAt,
        },
      });

      if (order.leadId && order.lead?.status !== LeadStatus.CANCELLED) {
        await tx.lead.update({
          where: { id: order.leadId },
          data: { status: LeadStatus.CANCELLED },
        });
      }

      if (targetReward && targetReward.gt(0)) {
        await this.balanceService.removeHold(
          order.targetologId,
          targetReward,
          {
            orderId: id,
            leadId: order.leadId,
            reason: 'ORDER_RETURNED',
          },
          tx,
        );
      }

      if (operatorReward && operatorReward.gt(0) && order.operatorId) {
        await this.balanceService.removeHold(
          order.operatorId,
          operatorReward,
          {
            orderId: id,
            leadId: order.leadId,
            role: 'OPERATOR',
            reason: 'ORDER_RETURNED',
          },
          tx,
        );
      }
    });

    const updated = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderRelations(),
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Buyurtma qaytarildi.',
      meta: { orderId: id },
    });

    await this.notifyTargetAndOperator(updated!, 'Buyurtma qaytarildi.');

    return {
      message: 'Buyurtma qaytarildi va hold balansdan olib tashlandi.',
      order: updated,
    };
  }

  private orderRelations(includeLead = false): Prisma.OrderInclude {
    return {
      product: {
        select: {
          id: true,
          title: true,
          cpaTargetolog: true,
          cpaOperator: true,
        },
      },
      targetolog: {
        select: {
          id: true,
          firstName: true,
          nickname: true,
          phone: true,
        },
      },
      operator: {
        select: {
          id: true,
          firstName: true,
          nickname: true,
          phone: true,
        },
      },
      ...(includeLead
        ? {
            lead: {
              select: {
                id: true,
                phone: true,
                name: true,
              },
            },
          }
        : {}),
    };
  }

  private async notifyTargetAndOperator(
    order: NonNullable<Awaited<ReturnType<typeof this.prisma.order.findUnique>>>,
    message: string,
  ) {
    await this.notificationsService.create({
      toUserId: order.targetologId,
      message,
      type: NotificationType.ORDER,
      metadata: { orderId: order.id },
    });

    if (order.operatorId) {
      await this.notificationsService.create({
        toUserId: order.operatorId,
        message,
        type: NotificationType.ORDER,
        metadata: { orderId: order.id },
      });
    }
  }

  private ensureCreatePermission(role: string) {
    if (!['ADMIN', 'OPER_ADMIN', 'TARGET_ADMIN'].includes(role)) {
      throw new ForbiddenException('Buyurtma yaratish uchun ruxsat yo‘q.');
    }
  }

  private ensureAssignPermission(role: string) {
    if (!['ADMIN', 'OPER_ADMIN'].includes(role)) {
      throw new ForbiddenException('Operator tayinlash uchun ruxsat yo‘q.');
    }
  }

  private ensureSkladPermission(role: string) {
    if (!['SKLAD_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      throw new ForbiddenException('Bu amalni bajarish uchun ruxsat yo‘q.');
    }
  }
}
