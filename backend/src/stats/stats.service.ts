import { Injectable } from '@nestjs/common';
import {
  LeadStatus,
  NotificationType,
  OrderStatus,
  PayoutStatus,
  UserStatus,
  type Prisma,
} from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

type TrendPoint = {
  label: string;
  value: number;
};

type QuickAction = {
  label: string;
  href: string;
};

type OrdersByStatusItem = {
  key: string;
  label: string;
  status: string;
  count: number;
  color: 'success' | 'info' | 'warning' | 'danger' | 'muted';
};

type TopPerformer = {
  id: string;
  name: string;
  orders: number;
  revenue?: number;
  leads?: number;
};

type DashboardContext = {
  role: string;
  userId: string;
  leadWhere: Prisma.LeadWhereInput;
  orderWhere: Prisma.OrderWhereInput;
  payoutWhere: Prisma.PayoutWhereInput;
  activityWhere: Prisma.ActivityLogWhereInput;
  notificationWhere: Prisma.NotificationWhereInput;
  quickActions: QuickAction[];
};

type SummaryInput = {
  leadsToday: number;
  ordersToday: number;
  pendingPayouts: number;
  deliveredOrders: number;
  deliveredRevenue: number;
  approvedPayouts: number;
  totalLeads: number;
  totalUsers: number;
  leadRecontactCount: number;
  roleCounts?: {
    targetologs: number;
    sellers: number;
    operators: number;
  };
  topTargetologCount?: number;
  topSellerCount?: number;
  topOperatorCount?: number;
};

const MONTH_LABELS = [
  'Yan',
  'Fev',
  'Mar',
  'Apr',
  'May',
  'Iyun',
  'Iyul',
  'Avg',
  'Sen',
  'Okt',
  'Noy',
  'Dek',
];

const WEEK_LABELS = ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha'];

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLandingStats() {
    const [
      activeUsers,
      totalLeads,
      deliveredOrders,
      topTargetologsRaw,
    ] = await Promise.all([
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.lead.count(),
      this.prisma.order.count({
        where: { status: OrderStatus.DELIVERED },
      }),
      this.prisma.order.groupBy({
        by: ['targetologId'],
        where: { status: OrderStatus.DELIVERED },
        _count: { _all: true },
        orderBy: {
          _count: { _all: 'desc' },
        },
        take: 5,
      }),
    ]);

    const targetologUsers =
      topTargetologsRaw.length > 0
        ? await this.prisma.user.findMany({
            where: {
              id: {
                in: topTargetologsRaw
                  .map((item) => item.targetologId)
                  .filter((value): value is string => Boolean(value)),
              },
            },
            select: { id: true, firstName: true, nickname: true },
          })
        : [];

    const topTargetologs = topTargetologsRaw.map((record) => {
      const user = targetologUsers.find(
        (candidate) => candidate.id === record.targetologId,
      );
      return {
        userId: record.targetologId,
        fullName: user
          ? `${user.firstName} (${user.nickname})`
          : 'Noma’lum targetolog',
        orders: Number(record._count?._all ?? 0),
      };
    });

    return {
      counts: {
        users: activeUsers,
        leads: totalLeads,
        sales: deliveredOrders,
        topTargetologs: topTargetologs.length,
      },
      topTargetologs,
      testimonials: [
        {
          name: 'Gulnora X.',
          role: 'Super Admin',
          message:
            'CPAMaRKeT.Uz orqali biz targetologlar va sotuvchilar ishini yagona joyda nazorat qilib, jarayonlarni tezlashtirdik.',
        },
        {
          name: 'Murodjon A.',
          role: 'Targetolog',
          message:
            'Leadlar statistikasi va tezkor to‘lovlar uchun eng qulay platforma. Yangi kampaniyalarni bir necha daqiqada ishga tushiraman.',
        },
        {
          name: 'Sabina R.',
          role: 'Operator',
          message:
            'Buyurtmalar bilan ishlash juda osonlashdi. Har bir mijozning holatini ko‘rib, tezkor aloqa o‘rnataman.',
        },
      ],
    };
  }

  async getDashboardStats(roleSlug: string, userId: string) {
    const context = this.buildContext(roleSlug.toUpperCase(), userId);

    const now = new Date();
    const sixMonthsAgo = this.startOfMonth(this.addMonths(now, -5));
    const sevenDaysAgo = this.startOfDay(this.addDays(now, -6));
    const startOfToday = this.startOfDay(now);

    const [
      activeUsers,
      totalLeads,
      totalDeliveredOrders,
      leadsToday,
      ordersToday,
      pendingPayouts,
      deliveredRevenue,
      approvedPayoutSum,
      monthlyLeadsDates,
      monthlyOrdersDates,
      weeklyActivityDates,
      leadRecontactCount,
      ordersByStatusRaw,
      recentActivityRaw,
      notificationsRaw,
    ] = await Promise.all([
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.lead.count({ where: context.leadWhere }),
      this.prisma.order.count({
        where: { ...context.orderWhere, status: OrderStatus.DELIVERED },
      }),
      this.prisma.lead.count({
        where: {
          ...context.leadWhere,
          createdAt: { gte: startOfToday },
        },
      }),
      this.prisma.order.count({
        where: {
          ...context.orderWhere,
          createdAt: { gte: startOfToday },
        },
      }),
      this.prisma.payout.count({
        where: {
          ...context.payoutWhere,
          status: PayoutStatus.PENDING,
        },
      }),
      this.prisma.order.aggregate({
        _sum: { amount: true },
        where: {
          ...context.orderWhere,
          status: OrderStatus.DELIVERED,
        },
      }),
      this.prisma.payout.aggregate({
        _sum: { amount: true },
        where: {
          ...context.payoutWhere,
          status: { in: [PayoutStatus.APPROVED, PayoutStatus.PAID] },
        },
      }),
      this.prisma.lead.findMany({
        where: {
          ...context.leadWhere,
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true },
      }),
      this.prisma.order.findMany({
        where: {
          ...context.orderWhere,
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true },
      }),
      this.prisma.activityLog.findMany({
        where: {
          ...context.activityWhere,
          createdAt: { gte: sevenDaysAgo },
        },
        select: { createdAt: true },
      }),
      this.prisma.lead.count({
        where: {
          ...context.leadWhere,
          status: LeadStatus.QAYTA_ALOQA,
        },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: context.orderWhere,
        _count: { _all: true },
      }),
      this.prisma.activityLog.findMany({
        where: context.activityWhere,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              nickname: true,
              role: { select: { slug: true } },
            },
          },
        },
      }),
      this.prisma.notification.findMany({
        where: context.notificationWhere,
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const roleCounts = this.requiresRoleCounts(context.role)
      ? await this.getRoleCounts()
      : null;

    const [topTargetologs, topSellers, topOperators] = await Promise.all([
      this.requiresTopTargetologs(context.role)
        ? this.fetchTopTargetologs(context.orderWhere)
        : Promise.resolve([]),
      this.requiresTopSellers(context.role)
        ? this.fetchTopSellers(context.orderWhere)
        : Promise.resolve([]),
      this.requiresTopOperators(context.role)
        ? this.fetchTopOperators(context.orderWhere)
        : Promise.resolve([]),
    ]);

    const leadTrend = this.buildMonthlyTrend(
      monthlyLeadsDates.map((record) => record.createdAt),
    );
    const salesTrend = this.buildMonthlyTrend(
      monthlyOrdersDates.map((record) => record.createdAt),
    );
    const activityTrend = this.buildWeeklyTrend(
      weeklyActivityDates.map((record) => record.createdAt),
    );

    const summaryCards = this.buildSummaryCards(context.role, {
      leadsToday,
      ordersToday,
      pendingPayouts,
      deliveredOrders: totalDeliveredOrders,
      deliveredRevenue: Number(deliveredRevenue._sum.amount ?? 0),
      approvedPayouts: Number(approvedPayoutSum._sum.amount ?? 0),
      totalLeads,
      totalUsers: activeUsers,
      leadRecontactCount,
      roleCounts: roleCounts ?? undefined,
      topTargetologCount: topTargetologs.length,
      topSellerCount: topSellers.length,
      topOperatorCount: topOperators.length,
    });

    const ordersByStatus = this.buildOrdersByStatus(
      ordersByStatusRaw,
      leadRecontactCount,
    );

    const recentActivity = recentActivityRaw.map((item) => ({
      id: item.id,
      message: item.action,
      createdAt: item.createdAt,
      user: item.user
        ? {
            id: item.user.id,
            name: `${item.user.firstName} (${item.user.nickname})`,
            role: item.user.role?.slug ?? null,
          }
        : null,
    }));

    const notifications = notificationsRaw.map((item) => ({
      id: item.id,
      message: item.message,
      type: item.type,
      seen: item.seen,
      createdAt: item.createdAt,
      metadata: item.metadata ?? null,
    }));

    return {
      role: context.role,
      overview: {
        totalUsers: activeUsers,
        totalLeads,
        deliveredOrders: totalDeliveredOrders,
        roleCounts: roleCounts ?? undefined,
      },
      summaryCards,
      charts: {
        leads: leadTrend,
        sales: salesTrend,
        activity: activityTrend,
      },
      ordersByStatus,
      topPerformers: {
        targetologists: topTargetologs,
        sellers: topSellers,
        operators: topOperators,
      },
      recentActivity,
      quickActions: context.quickActions,
      notifications,
    };
  }

  private buildContext(role: string, userId: string): DashboardContext {
    const leadWhere: Prisma.LeadWhereInput = {};
    const orderWhere: Prisma.OrderWhereInput = {};
    const payoutWhere: Prisma.PayoutWhereInput = {};
    const activityWhere: Prisma.ActivityLogWhereInput = {};
    const notificationWhere: Prisma.NotificationWhereInput = {};
    const quickActions: QuickAction[] = [];

    const hasUser = Boolean(userId);

    switch (role) {
      case 'ADMIN':
        activityWhere.user = {
          role: {
            slug: {
              in: ['OPERATOR', 'SKLAD_ADMIN'],
            },
          },
        };
        notificationWhere.type = {
          in: [
            NotificationType.SYSTEM,
            NotificationType.ORDER,
            NotificationType.LEAD,
            NotificationType.PAYOUT,
            NotificationType.USER,
          ],
        };
        quickActions.push(
          { label: 'Mahsulot qo‘shish', href: '/dashboard/admin/products/new' },
          { label: 'Foydalanuvchi yaratish', href: '/dashboard/admin/users/create' },
          { label: 'Buyurtmalarni boshqarish', href: '/dashboard/admin/orders' },
          { label: 'Bildirishnoma yuborish', href: '/dashboard/admin/notifications' },
        );
        break;
      case 'SUPER_ADMIN':
        activityWhere.user = {
          role: {
            slug: {
              in: ['ADMIN', 'SUPER_ADMIN'],
            },
          },
        };
        notificationWhere.type = {
          in: [NotificationType.SYSTEM, NotificationType.USER, NotificationType.ORDER],
        };
        quickActions.push(
          { label: 'Rollar va ruxsatlar', href: '/dashboard/super-admin/roles' },
          { label: 'Hisobotlarni ko‘rish', href: '/dashboard/super-admin/reports' },
        );
        break;
      case 'OPER_ADMIN':
        activityWhere.user = {
          role: {
            slug: 'OPERATOR',
          },
        };
        notificationWhere.OR = [
          { type: NotificationType.ORDER },
          { type: NotificationType.SYSTEM },
        ];
        quickActions.push(
          { label: 'Operator qo‘shish', href: '/dashboard/oper-admin/operators/new' },
          { label: 'Buyurtmalarni taqsimlash', href: '/dashboard/oper-admin/orders' },
        );
        break;
      case 'TARGET_ADMIN':
        activityWhere.user = {
          role: {
            slug: 'TARGETOLOG',
          },
        };
        notificationWhere.OR = [
          { type: NotificationType.LEAD },
          { type: NotificationType.USER },
        ];
        quickActions.push(
          { label: 'Targetolog qo‘shish', href: '/dashboard/target-admin/targetologs/new' },
          { label: 'Reyting hisobotlari', href: '/dashboard/target-admin/reports' },
        );
        break;
      case 'TAMINOTCHI':
          if (hasUser) {
            orderWhere.product = {
              ownerId: userId,
            };
          payoutWhere.userId = userId;
          activityWhere.userId = userId;
          notificationWhere.OR = [
            { toUserId: userId },
            { type: NotificationType.ORDER },
            { type: NotificationType.PAYOUT },
          ];
        }
        quickActions.push(
          { label: 'Mahsulot qo‘shish', href: '/dashboard/taminotchi/mahsulotlar/yangi' },
          { label: 'Buyurtmalarim', href: '/dashboard/taminotchi/buyurtmalar' },
        );
        break;
      case 'SKLAD_ADMIN':
        orderWhere.status = {
          in: [
            OrderStatus.ASSIGNED,
            OrderStatus.IN_DELIVERY,
            OrderStatus.DELIVERED,
            OrderStatus.RETURNED,
            OrderStatus.ARCHIVED,
          ],
        };
        activityWhere.user = {
          role: {
            slug: {
              in: ['SKLAD_ADMIN', 'OPERATOR'],
            },
          },
        };
        notificationWhere.OR = [
          { type: NotificationType.ORDER },
          { type: NotificationType.SYSTEM },
        ];
        quickActions.push(
          { label: 'Yetkazib berish jadvali', href: '/dashboard/sklad-admin/deliveries' },
          { label: 'Ombor inventari', href: '/dashboard/sklad-admin/warehouse' },
        );
        break;
      case 'TARGETOLOG':
        if (hasUser) {
          leadWhere.targetologId = userId;
          orderWhere.targetologId = userId;
          payoutWhere.userId = userId;
          activityWhere.userId = userId;
          notificationWhere.OR = [
            { toUserId: userId },
            { type: NotificationType.LEAD },
            { type: NotificationType.PAYOUT },
          ];
        }
        quickActions.push(
          { label: 'Mahsulot katalogi', href: '/dashboard/targetolog/products' },
          { label: 'Payout so‘rovi', href: '/dashboard/targetolog/payout' },
        );
        break;
      case 'OPERATOR':
        if (hasUser) {
          orderWhere.operatorId = userId;
          payoutWhere.userId = userId;
          activityWhere.userId = userId;
          notificationWhere.OR = [
            { toUserId: userId },
            { type: NotificationType.ORDER },
          ];
        }
        quickActions.push(
          { label: 'Yangi buyurtmalar', href: '/dashboard/operator/orders?status=yangi' },
          { label: 'Vazifalar jadvali', href: '/dashboard/operator/tasks' },
        );
        break;
      default:
        notificationWhere.type = {
          in: [NotificationType.SYSTEM, NotificationType.ORDER],
        };
        break;
    }

    return {
      role,
      userId,
      leadWhere,
      orderWhere,
      payoutWhere,
      activityWhere,
      notificationWhere,
      quickActions,
    };
  }

  private buildSummaryCards(role: string, data: SummaryInput) {
    const formatNumber = (value: number) =>
      value.toLocaleString('uz-UZ');
    const formatCurrency = (value: number) =>
      `${value.toLocaleString('uz-UZ')} so‘m`;

    if (role === 'ADMIN') {
      return [
        {
          label: 'Targetologlar',
          value: formatNumber(data.roleCounts?.targetologs ?? 0),
        },
        {
          label: 'Ta’minotchilar',
          value: formatNumber(data.roleCounts?.sellers ?? 0),
        },
        {
          label: 'Operatorlar',
          value: formatNumber(data.roleCounts?.operators ?? 0),
        },
        {
          label: 'Yakunlangan buyurtmalar',
          value: `${formatNumber(data.deliveredOrders)} ta`,
        },
      ];
    }

    if (role === 'SUPER_ADMIN') {
      return [
        {
          label: 'Faol foydalanuvchilar',
          value: formatNumber(data.totalUsers),
        },
        {
          label: 'Umumiy leadlar',
          value: `${formatNumber(data.totalLeads)} ta`,
        },
        {
          label: 'Yakunlangan buyurtmalar',
          value: `${formatNumber(data.deliveredOrders)} ta`,
        },
        {
          label: 'Top targetologlar',
          value: `${formatNumber(data.topTargetologCount ?? 0)} ta`,
        },
      ];
    }

    if (role === 'OPER_ADMIN') {
      return [
        {
          label: 'Bugungi buyurtmalar',
          value: `${formatNumber(data.ordersToday)} ta`,
        },
        {
          label: 'Yakunlangan buyurtmalar',
          value: `${formatNumber(data.deliveredOrders)} ta`,
        },
        {
          label: 'Qayta aloqa kerak',
          value: `${formatNumber(data.leadRecontactCount)} ta`,
        },
        {
          label: 'Top operatorlar',
          value: `${formatNumber(data.topOperatorCount ?? 0)} ta`,
        },
      ];
    }

    if (role === 'TARGET_ADMIN') {
      return [
        {
          label: 'Bugungi leadlar',
          value: `${formatNumber(data.leadsToday)} ta`,
        },
        {
          label: 'Yakunlangan sotuvlar',
          value: `${formatNumber(data.deliveredOrders)} ta`,
        },
        {
          label: 'Qayta aloqa leadlar',
          value: `${formatNumber(data.leadRecontactCount)} ta`,
        },
        {
          label: 'Top targetologlar',
          value: `${formatNumber(data.topTargetologCount ?? 0)} ta`,
        },
      ];
    }

    if (role === 'TAMINOTCHI') {
      return [
        {
          label: 'Bugungi buyurtmalar',
          value: `${formatNumber(data.ordersToday)} ta`,
        },
        {
          label: 'Yakunlangan buyurtmalar',
          value: `${formatNumber(data.deliveredOrders)} ta`,
        },
        {
          label: 'Tasdiqlangan daromad',
          value: formatCurrency(data.deliveredRevenue),
        },
        {
          label: 'Top mahsulotlar',
          value: `${formatNumber(data.topSellerCount ?? 0)} ta`,
        },
      ];
    }

    if (role === 'SKLAD_ADMIN') {
      return [
        {
          label: 'Yetkazilishi kerak',
          value: `${formatNumber(data.deliveredOrders)} ta`,
        },
        {
          label: 'Bugungi jo‘natmalar',
          value: `${formatNumber(data.ordersToday)} ta`,
        },
        {
          label: 'Qayta aloqa / muammolar',
          value: `${formatNumber(data.leadRecontactCount)} ta`,
        },
        {
          label: 'Yetkazib berilgan savdolar',
          value: formatCurrency(data.deliveredRevenue),
        },
      ];
    }

    if (role === 'TARGETOLOG') {
      return [
        {
          label: 'Bugungi leadlar',
          value: `${formatNumber(data.leadsToday)} ta`,
        },
        {
          label: 'Yakunlangan buyurtmalar',
          value: `${formatNumber(data.deliveredOrders)} ta`,
        },
        {
          label: 'Kutilayotgan to‘lovlar',
          value: `${formatNumber(data.pendingPayouts)} ta`,
        },
        {
          label: 'Tasdiqlangan to‘lovlar',
          value: formatCurrency(data.approvedPayouts),
        },
      ];
    }

    if (role === 'TAMINOTCHI') {
      return [
        {
          label: 'Bugungi buyurtmalar',
          value: `${formatNumber(data.ordersToday)} ta`,
        },
        {
          label: 'Yakunlangan sotuvlar',
          value: `${formatNumber(data.deliveredOrders)} ta`,
        },
        {
          label: 'Balans',
          value: formatCurrency(data.approvedPayouts),
        },
        {
          label: 'Kutilayotgan to‘lovlar',
          value: `${formatNumber(data.pendingPayouts)} ta`,
        },
      ];
    }

    if (role === 'OPERATOR') {
      return [
        {
          label: 'Bugungi buyurtmalar',
          value: `${formatNumber(data.ordersToday)} ta`,
        },
        {
          label: 'Yakunlangan buyurtmalar',
          value: `${formatNumber(data.deliveredOrders)} ta`,
        },
        {
          label: 'Rekontaktda',
          value: `${formatNumber(data.leadRecontactCount)} ta`,
        },
        {
          label: 'Yakunlangan savdolar',
          value: formatCurrency(data.deliveredRevenue),
        },
      ];
    }

    return [
      {
        label: 'Bugungi leadlar',
        value: `${formatNumber(data.leadsToday)} ta`,
      },
      {
        label: 'Bugungi buyurtmalar',
        value: `${formatNumber(data.ordersToday)} ta`,
      },
      {
        label: 'Tasdiqlangan buyurtmalar',
        value: `${formatNumber(data.deliveredOrders)} ta`,
      },
      {
        label: 'Tasdiqlangan daromad',
        value: formatCurrency(data.deliveredRevenue),
      },
    ];
  }

  private buildOrdersByStatus(
    groups: { status: OrderStatus; _count: { _all: number } }[],
    recontactCount: number,
  ): OrdersByStatusItem[] {
    const map = new Map<OrderStatus, number>();
    for (const group of groups) {
      map.set(group.status, Number(group._count?._all ?? 0));
    }

    const getCount = (status: OrderStatus) => map.get(status) ?? 0;

    return [
      {
        key: 'new',
        label: 'Yangi',
        status: OrderStatus.NEW,
        count: getCount(OrderStatus.NEW),
        color: 'info',
      },
      {
        key: 'assigned',
        label: 'Operator belgilandi',
        status: OrderStatus.ASSIGNED,
        count: getCount(OrderStatus.ASSIGNED),
        color: 'info',
      },
      {
        key: 'in_delivery',
        label: 'Yetkazilmoqda',
        status: OrderStatus.IN_DELIVERY,
        count: getCount(OrderStatus.IN_DELIVERY),
        color: 'info',
      },
      {
        key: 'delivered',
        label: 'Yetkazilgan',
        status: OrderStatus.DELIVERED,
        count: getCount(OrderStatus.DELIVERED),
        color: 'success',
      },
      {
        key: 'returned',
        label: 'Qaytarilgan',
        status: OrderStatus.RETURNED,
        count: getCount(OrderStatus.RETURNED),
        color: 'danger',
      },
      {
        key: 'recontact',
        label: 'Qayta aloqa',
        status: 'RECONTACT',
        count: recontactCount,
        color: 'warning',
      },
      {
        key: 'archived',
        label: 'Arxiv',
        status: OrderStatus.ARCHIVED,
        count: getCount(OrderStatus.ARCHIVED),
        color: 'muted',
      },
    ];
  }

  private requiresRoleCounts(role: string) {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  private requiresTopTargetologs(role: string) {
    return ['ADMIN', 'SUPER_ADMIN', 'TARGET_ADMIN'].includes(role);
  }

  private requiresTopSellers(role: string) {
    return ['ADMIN', 'SUPER_ADMIN', 'TAMINOTCHI'].includes(role);
  }

  private requiresTopOperators(role: string) {
    return ['ADMIN', 'SUPER_ADMIN', 'OPER_ADMIN', 'SKLAD_ADMIN'].includes(role);
  }

  private async getRoleCounts() {
    const [targetologs, sellers, operators] = await Promise.all([
      this.prisma.user.count({
        where: { role: { slug: 'TARGETOLOG' }, status: UserStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { role: { slug: 'TAMINOTCHI' }, status: UserStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { role: { slug: 'OPERATOR' }, status: UserStatus.ACTIVE },
      }),
    ]);

    return { targetologs, sellers, operators };
  }

  private async fetchTopTargetologs(
    orderWhere: Prisma.OrderWhereInput,
  ): Promise<TopPerformer[]> {
    const where: Prisma.OrderWhereInput = {
      ...orderWhere,
      targetologId: { not: null },
      status: OrderStatus.DELIVERED,
    };

    const grouped = await this.prisma.order.groupBy({
      by: ['targetologId'],
      where,
      _count: { _all: true },
      _sum: { amount: true },
      orderBy: {
        _count: { _all: 'desc' },
      },
      take: 5,
    });

    const ids = grouped
      .map((item) => item.targetologId)
      .filter((value): value is string => Boolean(value));

    if (ids.length === 0) {
      return [];
    }

    const [users, leadCounts] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, firstName: true, nickname: true },
      }),
      this.prisma.lead.groupBy({
        by: ['targetologId'],
        where: { targetologId: { in: ids } },
        _count: { _all: true },
      }),
    ]);

    const userMap = new Map(
      users.map((user) => [
        user.id,
        `${user.firstName} (${user.nickname})`,
      ]),
    );
    const leadMap = new Map(
      leadCounts.map((item) => [item.targetologId, Number(item._count?._all ?? 0)]),
    );

    return grouped.map((item) => ({
      id: item.targetologId ?? '',
      name: userMap.get(item.targetologId ?? '') ?? 'Noma’lum targetolog',
      orders: Number(item._count?._all ?? 0),
      revenue: Number(item._sum?.amount ?? 0),
      leads: leadMap.get(item.targetologId ?? '') ?? 0,
    }));
  }

  private async fetchTopSellers(
    orderWhere: Prisma.OrderWhereInput,
  ): Promise<TopPerformer[]> {
    const where: Prisma.OrderWhereInput = {
      ...orderWhere,
      status: OrderStatus.DELIVERED,
    };

    const grouped = await this.prisma.order.groupBy({
      by: ['productId'],
      where,
      _count: { _all: true },
      _sum: { amount: true },
    });

    const productIds = grouped
      .map((item) => item.productId)
      .filter((value): value is string => Boolean(value));

    if (productIds.length === 0) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        ownerId: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            nickname: true,
          },
        },
      },
    });

    const productMap = new Map(products.map((item) => [item.id, item]));
    const ownerMap = new Map<
      string,
      { id: string; name: string; orders: number; revenue: number }
    >();

    for (const item of grouped) {
      const product = item.productId
        ? productMap.get(item.productId)
        : undefined;
      if (!product?.owner) {
        continue;
      }
      const ownerId = product.owner.id;
      const current = ownerMap.get(ownerId) ?? {
        id: ownerId,
        name: `${product.owner.firstName} (${product.owner.nickname})`,
        orders: 0,
        revenue: 0,
      };

      current.orders += Number(item._count?._all ?? 0);
      current.revenue += Number(item._sum?.amount ?? 0);

      ownerMap.set(ownerId, current);
    }

    return Array.from(ownerMap.values())
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);
  }

  private async fetchTopOperators(
    orderWhere: Prisma.OrderWhereInput,
  ): Promise<TopPerformer[]> {
    const where: Prisma.OrderWhereInput = {
      ...orderWhere,
      operatorId: { not: null },
      status: {
        in: [
          OrderStatus.ASSIGNED,
          OrderStatus.IN_DELIVERY,
          OrderStatus.DELIVERED,
          OrderStatus.RETURNED,
        ],
      },
    };

    const grouped = await this.prisma.order.groupBy({
      by: ['operatorId'],
      where,
      _count: { _all: true },
      orderBy: {
        _count: { _all: 'desc' },
      },
      take: 5,
    });

    const operatorIds = grouped
      .map((item) => item.operatorId)
      .filter((value): value is string => Boolean(value));

    if (operatorIds.length === 0) {
      return [];
    }

    const operators = await this.prisma.user.findMany({
      where: { id: { in: operatorIds } },
      select: { id: true, firstName: true, nickname: true },
    });

    const operatorMap = new Map(
      operators.map((user) => [
        user.id,
        `${user.firstName} (${user.nickname})`,
      ]),
    );

    return grouped.map((item) => ({
      id: item.operatorId ?? '',
      name: operatorMap.get(item.operatorId ?? '') ?? 'Noma’lum operator',
      orders: Number(item._count?._all ?? 0),
    }));
  }

  private buildMonthlyTrend(dates: Date[]): TrendPoint[] {
    const months = this.getMonthsRange(6);
    const occurrences = this.countByMonth(dates);

    return months.map((month) => {
      const key = `${month.getFullYear()}-${month.getMonth()}`;
      return {
        label: MONTH_LABELS[month.getMonth()],
        value: occurrences.get(key) ?? 0,
      };
    });
  }

  private buildWeeklyTrend(dates: Date[]): TrendPoint[] {
    const days = this.getDaysRange(7);
    const counts = this.countByDay(dates);

    return days.map((day) => {
      const key = this.formatDayKey(day);
      return {
        label: WEEK_LABELS[day.getDay()],
        value: counts.get(key) ?? 0,
      };
    });
  }

  private countByMonth(dates: Date[]) {
    const counts = new Map<string, number>();
    for (const date of dates) {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }

  private countByDay(dates: Date[]) {
    const counts = new Map<string, number>();
    for (const date of dates) {
      const key = this.formatDayKey(date);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }

  private getMonthsRange(length: number) {
    const months: Date[] = [];
    const current = this.startOfMonth(new Date());
    for (let index = length - 1; index >= 0; index -= 1) {
      const month = this.startOfMonth(this.addMonths(current, -index));
      months.push(month);
    }
    return months;
  }

  private getDaysRange(length: number) {
    const days: Date[] = [];
    const current = this.startOfDay(new Date());
    for (let index = length - 1; index >= 0; index -= 1) {
      const day = this.startOfDay(this.addDays(current, -index));
      days.push(day);
    }
    return days;
  }

  private addMonths(date: Date, months: number) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  private addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private startOfMonth(date: Date) {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private startOfDay(date: Date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private formatDayKey(date: Date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }
}
