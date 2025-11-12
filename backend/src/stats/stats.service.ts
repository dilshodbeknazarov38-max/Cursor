import { Injectable } from '@nestjs/common';
import {
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

type DashboardContext = {
  role: string;
  userId: string;
  leadWhere: Prisma.LeadWhereInput;
  orderWhere: Prisma.OrderWhereInput;
  payoutWhere: Prisma.PayoutWhereInput;
  activityWhere: Prisma.ActivityLogWhereInput;
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
            where: { id: { in: topTargetologsRaw.map((item) => item.targetologId) } },
            select: { id: true, firstName: true, nickname: true },
          })
        : [];
    const topTargetologs = topTargetologsRaw.map((record) => {
      const user = targetologUsers.find((candidate) => candidate.id === record.targetologId);
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

    const sixMonthsAgo = this.startOfMonth(this.addMonths(new Date(), -5));
    const sevenDaysAgo = this.startOfDay(this.addDays(new Date(), -6));
    const startOfToday = this.startOfDay(new Date());

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
    ]);

    const leadTrend = this.buildMonthlyTrend(
      monthlyLeadsDates.map((record) => record.createdAt),
    );
    const salesTrend = this.buildMonthlyTrend(
      monthlyOrdersDates.map((record) => record.createdAt),
    );
    const activeTrend = this.buildWeeklyTrend(
      weeklyActivityDates.map((record) => record.createdAt),
    );

    const deliveredRevenueNumber = Number(
      deliveredRevenue._sum.amount ?? 0,
    );
    const approvedPayoutNumber = Number(
      approvedPayoutSum._sum.amount ?? 0,
    );

    const metrics = this.buildMetrics(context.role, {
      leadsToday,
      ordersToday,
      pendingPayouts,
      deliveredOrders: totalDeliveredOrders,
      deliveredRevenue: deliveredRevenueNumber,
      approvedPayouts: approvedPayoutNumber,
    });

    return {
      role: context.role,
      metrics,
      charts: {
        leads: leadTrend,
        sales: salesTrend,
        active: activeTrend,
      },
      summary: {
        users: activeUsers,
        leads: totalLeads,
        sales: totalDeliveredOrders,
      },
    };
  }

  private buildContext(role: string, userId: string): DashboardContext {
    const leadWhere: Prisma.LeadWhereInput = {};
    const orderWhere: Prisma.OrderWhereInput = {};
    const payoutWhere: Prisma.PayoutWhereInput = {};
    const activityWhere: Prisma.ActivityLogWhereInput = {};

    const hasUser = Boolean(userId);

    switch (role) {
      case 'TARGETOLOG':
        if (hasUser) {
          leadWhere.targetologId = userId;
          orderWhere.targetologId = userId;
          payoutWhere.userId = userId;
          activityWhere.userId = userId;
        }
        break;
      case 'OPERATOR':
        if (hasUser) {
          orderWhere.operatorId = userId;
          activityWhere.userId = userId;
        }
        break;
      case 'SKLAD_ADMIN':
        orderWhere.status = OrderStatus.IN_DELIVERY;
        if (hasUser) {
          activityWhere.userId = userId;
        }
        break;
      default:
        // Administrativ rollar umumiy ma’lumotlarni ko‘ra oladi.
        break;
    }

    return {
      role,
      userId,
      leadWhere,
      orderWhere,
      payoutWhere,
      activityWhere,
    };
  }

  private buildMetrics(
    role: string,
    data: {
      leadsToday: number;
      ordersToday: number;
      pendingPayouts: number;
      deliveredOrders: number;
      deliveredRevenue: number;
      approvedPayouts: number;
    },
  ) {
    const formatNumber = (value: number) =>
      value.toLocaleString('uz-UZ');
    const formatCurrency = (value: number) =>
      `${value.toLocaleString('uz-UZ')} so‘m`;

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
          label: 'Kutilayotgan qo‘ng‘iroqlar',
          value: `${formatNumber(Math.max(data.pendingPayouts, 0))} ta`,
        },
        {
          label: 'Yakunlangan savdolar',
          value: formatCurrency(data.deliveredRevenue),
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
          label: 'Qabul qilish kutilmoqda',
          value: `${formatNumber(data.pendingPayouts)} ta`,
        },
        {
          label: 'Yetkazib berilgan savdolar',
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
