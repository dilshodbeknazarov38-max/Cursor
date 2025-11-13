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
import { BalancesService } from '@/balances/balances.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { PrismaService } from '@/prisma/prisma.service';

import { AssignOperatorDto } from './dto/assign-operator.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

type AuthContext = {
  userId: string;
  role: string;
};

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.NEW]: [OrderStatus.ASSIGNED, OrderStatus.ARCHIVED],
  [OrderStatus.ASSIGNED]: [
    OrderStatus.IN_DELIVERY,
    OrderStatus.RETURNED,
    OrderStatus.ARCHIVED,
  ],
  [OrderStatus.IN_DELIVERY]: [
    OrderStatus.DELIVERED,
    OrderStatus.RETURNED,
    OrderStatus.ARCHIVED,
  ],
  [OrderStatus.DELIVERED]: [OrderStatus.ARCHIVED],
  [OrderStatus.RETURNED]: [OrderStatus.ARCHIVED],
  [OrderStatus.ARCHIVED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
    private readonly balancesService: BalancesService,
  ) {}

  async create(dto: CreateOrderDto, context: AuthContext) {
    this.ensureCreatePermission(context.role);

    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        status: { not: ProductStatus.ARCHIVED },
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

    const initialStatus = operator ? OrderStatus.ASSIGNED : OrderStatus.NEW;

    const order = await this.prisma.order.create({
      data: {
        productId: product.id,
        targetologId: targetolog.id,
        operatorId: operator?.id,
        leadId: lead?.id,
        status: initialStatus,
        amount: new Prisma.Decimal(dto.amount),
      },
      include: {
        product: true,
        targetolog: {
          select: {
            id: true,
            firstName: true,
            nickname: true,
          },
        },
        operator: {
          select: {
            id: true,
            firstName: true,
            nickname: true,
          },
        },
        lead: true,
      },
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
      message: `Mahsulot bo‘yicha yangi buyurtma yaratildi: ${order.product.name}`,
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

    if (context.role === 'TARGETOLOG') {
      where.targetologId = context.userId;
    } else if (context.role === 'OPERATOR') {
      where.operatorId = context.userId;
    } else if (context.role === 'SKLAD_ADMIN') {
      where.status = OrderStatus.IN_DELIVERY;
    }

    if (filter?.status && context.role !== 'SKLAD_ADMIN') {
      where.status = filter.status;
    }
    if (filter?.productId) {
      where.productId = filter.productId;
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
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
      },
    });
  }

  async assignOperator(id: string, dto: AssignOperatorDto, context: AuthContext) {
    this.ensureAssignPermission(context.role);

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        targetolog: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
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
        status: OrderStatus.ASSIGNED,
      },
      include: {
        product: true,
      },
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
      message: `Sizga yangi buyurtma biriktirildi: ${updated.product.name}`,
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

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    context: AuthContext,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        lead: true,
        product: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }

    this.ensureStatusPermission(context, order, dto.status);

    if (!ORDER_TRANSITIONS[order.status].includes(dto.status)) {
      throw new BadRequestException(
        `Buyurtmani ${order.status} holatidan ${dto.status} holatiga o‘tkazib bo‘lmaydi.`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });

    await this.activityService.log({
      userId: context.userId,
      action: `Buyurtma statusi yangilandi: ${dto.status}`,
      meta: {
        orderId: updated.id,
        status: dto.status,
      },
    });

    if (dto.status === OrderStatus.DELIVERED && order.leadId) {
      await this.prisma.lead.update({
        where: { id: order.leadId },
        data: { status: LeadStatus.TASDIQLANGAN },
      });
      await this.balancesService.handleOrderDelivered(id, context.userId);
    }

    if (dto.status === OrderStatus.RETURNED && order.leadId) {
      await this.prisma.lead.update({
        where: { id: order.leadId },
        data: { status: LeadStatus.RAD_ETILGAN },
      });
      await this.balancesService.handleLeadCancelled(
        order.leadId,
        context.userId,
      );
      await this.balancesService.handleOrderReturned(id, context.userId);
    }

    await this.notificationsService.create({
      toUserId: order.targetologId,
      message: `Buyurtma holati yangilandi: ${dto.status}`,
      type: NotificationType.ORDER,
      metadata: { orderId: updated.id },
    });

    if (order.operatorId) {
      await this.notificationsService.create({
        toUserId: order.operatorId,
        message: `Buyurtma holati yangilandi: ${dto.status}`,
        type: NotificationType.ORDER,
        metadata: { orderId: updated.id },
      });
    }

    return {
      message: 'Buyurtma statusi yangilandi.',
      order: updated,
    };
  }

  async archive(id: string, context: AuthContext) {
    if (context.role !== 'ADMIN') {
      throw new ForbiddenException('Buyurtmani arxivlash uchun ruxsat yo‘q.');
    }

    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.ARCHIVED },
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Buyurtma arxivlandi.',
      meta: { orderId: updated.id },
    });

    return {
      message: 'Buyurtma arxiv holatiga o‘tkazildi.',
      order: updated,
    };
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

  private ensureStatusPermission(
    context: AuthContext,
    order: { operatorId: string | null; targetologId: string },
    nextStatus: OrderStatus,
  ) {
    if (['ADMIN', 'OPER_ADMIN'].includes(context.role)) {
      return;
    }

    if (context.role === 'OPERATOR') {
      if (order.operatorId !== context.userId) {
        throw new ForbiddenException(
          'Ushbu buyurtma sizga biriktirilmagan.',
        );
      }
      const allowed = [
        OrderStatus.IN_DELIVERY,
        OrderStatus.DELIVERED,
        OrderStatus.RETURNED,
      ];
      if (!allowed.includes(nextStatus)) {
        throw new ForbiddenException(
          'Buyurtma holatini o‘zgartirish uchun ruxsatingiz yo‘q.',
        );
      }
      return;
    }

    if (context.role === 'SKLAD_ADMIN') {
      const allowed = [OrderStatus.DELIVERED, OrderStatus.RETURNED];
      if (!allowed.includes(nextStatus)) {
        throw new ForbiddenException(
          'Bu statusni o‘rnatish uchun ruxsatingiz yo‘q.',
        );
      }
      return;
    }

    throw new ForbiddenException(
      'Buyurtma holatini o‘zgartirish uchun ruxsatingiz yo‘q.',
    );
  }
}
