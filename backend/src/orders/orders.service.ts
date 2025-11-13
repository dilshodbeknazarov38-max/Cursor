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
import { TelegramService } from '@/notifications/telegram.service';
import { PrismaService } from '@/prisma/prisma.service';
import { WarehouseService } from '@/warehouse/warehouse.service';

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
    private readonly warehouseService: WarehouseService,
    private readonly telegramService: TelegramService,
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

    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          packedAt: true,
          productId: true,
          product: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Buyurtma topilmadi.');
      }
      if (order.status !== OrderStatus.PACKING) {
        throw new BadRequestException('Buyurtma qadoqlash holatida emas.');
      }

      if (!order.packedAt) {
        await this.warehouseService.reserveProduct(
          order.productId,
          1,
          order.id,
          context.userId,
          tx,
        );
      }

      await tx.order.update({
        where: { id },
        data: {
          packedAt: order.packedAt ?? new Date(),
        },
      });
    });

    const updated = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderRelations(true),
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Buyurtma qadoqlanishi tasdiqlandi.',
      meta: { orderId: updated?.id ?? id },
    });

    return {
      message: 'Buyurtma qadoqlandi.',
      order: updated,
    };
  }

  async shipOrder(id: string, context: AuthContext) {
    this.ensureSkladPermission(context.role);

    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          packedAt: true,
          productId: true,
          product: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!current) {
        throw new NotFoundException('Buyurtma topilmadi.');
      }
      if (current.status !== OrderStatus.PACKING) {
        throw new BadRequestException('Buyurtma jo‘natish uchun tayyor emas.');
      }

      const now = new Date();

      if (!current.packedAt) {
        await this.warehouseService.reserveProduct(
          current.productId,
          1,
          current.id,
          context.userId,
          tx,
        );
      }

      return tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.SHIPPED,
          packedAt: current.packedAt ?? now,
          shippedAt: now,
        },
        include: this.orderRelations(true),
      });
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Buyurtma jo‘natildi.',
      meta: { orderId: updated.id },
    });

    await this.notifyTargetAndOperator(updated, 'Buyurtma jo‘natildi.');
    await this.notifyTelegram(
      `📦 Buyurtma *${updated.id}* jo‘natildi. Mahsulot: *${updated.product.title}*.`,
    );

    return {
      message: 'Buyurtma jo‘natildi.',
      order: updated,
    };
  }

  async deliverOrder(id: string, context: AuthContext) {
    this.ensureSkladPermission(context.role);

    const delivered = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        include: {
          product: true,
          lead: true,
        },
      });

      if (!current) {
        throw new NotFoundException('Buyurtma topilmadi.');
      }
      if (current.status !== OrderStatus.SHIPPED) {
        throw new BadRequestException('Buyurtma yetkazib berish holatida emas.');
      }

      const targetReward = current.product?.cpaTargetolog
        ? new Prisma.Decimal(current.product.cpaTargetolog)
        : null;
      const operatorReward =
        current.product?.cpaOperator && current.operatorId
          ? new Prisma.Decimal(current.product.cpaOperator)
          : null;

      const deliveredAt = new Date();

      await this.warehouseService.commitReservation(
        current.productId,
        1,
        current.id,
        context.userId,
        tx,
      );

      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.DELIVERED,
          deliveredAt,
        },
      });

      if (current.leadId && current.lead?.status !== LeadStatus.CONFIRMED) {
        await tx.lead.update({
          where: { id: current.leadId },
          data: { status: LeadStatus.CONFIRMED },
        });
      }

      if (targetReward && targetReward.gt(0)) {
        await this.balanceService.releaseHoldToMain(
          current.targetologId,
          targetReward,
          {
            orderId: id,
            leadId: current.leadId,
          },
          tx,
        );
      }

      if (operatorReward && operatorReward.gt(0) && current.operatorId) {
        await this.balanceService.releaseHoldToMain(
          current.operatorId,
          operatorReward,
          {
            orderId: id,
            leadId: current.leadId,
            role: 'OPERATOR',
          },
          tx,
        );
      }

      return tx.order.findUnique({
        where: { id },
        include: this.orderRelations(true),
      });
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Buyurtma yetkazildi.',
      meta: { orderId: id },
    });

    if (delivered) {
      await this.notifyTargetAndOperator(delivered, 'Buyurtma yetkazib berildi.');
      await this.notifyTelegram(
        `✅ Buyurtma *${delivered.id}* yetkazib berildi. Mahsulot: *${delivered.product.title}*.`,
      );
    }

    return {
      message: 'Buyurtma muvaffaqiyatli yetkazildi.',
      order: delivered,
    };
  }

  async returnOrder(id: string, context: AuthContext) {
    this.ensureSkladPermission(context.role);

    const returned = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        include: {
          product: true,
          lead: true,
        },
      });

      if (!current) {
        throw new NotFoundException('Buyurtma topilmadi.');
      }
      if (
        current.status !== OrderStatus.PACKING &&
        current.status !== OrderStatus.SHIPPED
      ) {
        throw new BadRequestException(
          'Buyurtmani qaytarish faqat qadoqlash yoki jo‘natish bosqichida mumkin.',
        );
      }

      const targetReward = current.product?.cpaTargetolog
        ? new Prisma.Decimal(current.product.cpaTargetolog)
        : null;
      const operatorReward =
        current.product?.cpaOperator && current.operatorId
          ? new Prisma.Decimal(current.product.cpaOperator)
          : null;

      const returnedAt = new Date();

      if (current.packedAt) {
        await this.warehouseService.releaseReservation(
          current.productId,
          1,
          current.id,
          context.userId,
          tx,
        );
      }

      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.RETURNED,
          returnedAt,
        },
      });

      if (current.leadId && current.lead?.status !== LeadStatus.CANCELLED) {
        await tx.lead.update({
          where: { id: current.leadId },
          data: { status: LeadStatus.CANCELLED },
        });
      }

      if (targetReward && targetReward.gt(0)) {
        await this.balanceService.removeHold(
          current.targetologId,
          targetReward,
          {
            orderId: id,
            leadId: current.leadId,
            reason: 'ORDER_RETURNED',
          },
          tx,
        );
      }

      if (operatorReward && operatorReward.gt(0) && current.operatorId) {
        await this.balanceService.removeHold(
          current.operatorId,
          operatorReward,
          {
            orderId: id,
            leadId: current.leadId,
            role: 'OPERATOR',
            reason: 'ORDER_RETURNED',
          },
          tx,
        );
      }

      return tx.order.findUnique({
        where: { id },
        include: this.orderRelations(true),
      });
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Buyurtma qaytarildi.',
      meta: { orderId: id },
    });

    if (returned) {
      await this.notifyTargetAndOperator(returned, 'Buyurtma qaytarildi.');
      await this.notifyTelegram(
        `↩️ Buyurtma *${returned.id}* qaytarildi. Mahsulot: *${returned.product.title}*.`,
      );
    }

    return {
      message: 'Buyurtma qaytarildi va hold balansdan olib tashlandi.',
      order: returned,
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

  private async notifyTelegram(message: string) {
    await this.telegramService.sendMessage(message);
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
