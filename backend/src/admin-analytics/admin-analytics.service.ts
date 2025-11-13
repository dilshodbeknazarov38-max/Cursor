import { Injectable } from '@nestjs/common';
import { OrderStatus, PayoutStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

type Numeric = Prisma.Decimal | number | null | undefined;

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(days = 30) {
    const rangeDays = Math.max(1, Math.min(days, 180));
    const rangeStart = this.subtractDays(new Date(), rangeDays - 1);

    const [
      totalUsers,
      activeUsers,
      newUsersRange,
      totalLeads,
      deliveredOrdersAggregate,
      flowsCount,
      balanceAggregate,
      pendingPayoutAggregate,
      topFlows,
      targetologOrderGroups,
      operatorOrderGroups,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: rangeStart } },
      }),
      this.prisma.lead.count(),
      this.prisma.order.aggregate({
        where: { status: OrderStatus.DELIVERED },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.flow.count(),
      this.prisma.userBalance.aggregate({
        _sum: { holdBalance: true, mainBalance: true },
      }),
      this.prisma.payoutRequest.aggregate({
        where: { status: PayoutStatus.PENDING },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.flow.findMany({
        orderBy: [{ leads: 'desc' }, { orders: 'desc' }],
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          clicks: true,
          leads: true,
          orders: true,
        },
      }),
      this.prisma.order.groupBy({
        by: ['targetologId'],
        where: {
          status: OrderStatus.DELIVERED,
          createdAt: { gte: rangeStart },
        },
        _count: true,
        _sum: { amount: true },
        orderBy: {
          targetologId: 'asc',
        },
      }),
      this.prisma.order.groupBy({
        by: ['operatorId'],
        where: {
          operatorId: { not: undefined },
          status: {
            in: [
              OrderStatus.PACKING,
              OrderStatus.SHIPPED,
              OrderStatus.DELIVERED,
              OrderStatus.RETURNED,
            ],
          },
          updatedAt: { gte: rangeStart },
        },
        _count: true,
        orderBy: {
          operatorId: 'asc',
        },
      }),
    ]);

    const targetologIds = targetologOrderGroups
      .map((group) => group.targetologId)
      .filter((value): value is string => Boolean(value));
    const operatorIds = operatorOrderGroups
      .map((group) => group.operatorId)
      .filter((value): value is string => Boolean(value));

      const targetologUsers = targetologIds.length
        ? await this.prisma.user.findMany({
            where: { id: { in: targetologIds } },
            select: { id: true, firstName: true, nickname: true },
          })
        : [];
      const operatorUsers = operatorIds.length
        ? await this.prisma.user.findMany({
            where: { id: { in: operatorIds } },
            select: { id: true, firstName: true, nickname: true },
          })
        : [];

      const revenueTotal = this.toNumber(deliveredOrdersAggregate._sum?.amount);
    const holdTotal = this.toNumber(balanceAggregate._sum?.holdBalance);
    const mainTotal = this.toNumber(balanceAggregate._sum?.mainBalance);

    return {
      range: {
        days: rangeDays,
        since: rangeStart,
      },
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newInRange: newUsersRange,
        },
        leads: totalLeads,
          orders: deliveredOrdersAggregate._count ?? 0,
        revenue: revenueTotal,
        flows: flowsCount,
        balances: {
          hold: holdTotal,
          main: mainTotal,
          total: holdTotal + mainTotal,
        },
        payouts: {
            pendingCount: pendingPayoutAggregate._count ?? 0,
            pendingAmount: this.toNumber(pendingPayoutAggregate._sum?.amount),
        },
      },
      topFlows: topFlows.map((flow) => ({
        ...flow,
        conversion: flow.clicks ? Number(((flow.orders / Math.max(flow.clicks, 1)) * 100).toFixed(2)) : 0,
      })),
      topTargetologs: targetologOrderGroups
        .map((group) => {
          const user = targetologUsers.find((candidate) => candidate.id === group.targetologId);
          return {
            id: group.targetologId,
            name: user
              ? `${user.firstName} (${user.nickname})`
              : group.targetologId ?? 'Noma’lum targetolog',
              orders: group._count ?? 0,
              revenue: this.toNumber(group._sum?.amount),
          };
        })
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5),
      topOperators: operatorOrderGroups
        .map((group) => {
          const user = operatorUsers.find((candidate) => candidate.id === group.operatorId);
          return {
            id: group.operatorId,
            name: user
              ? `${user.firstName} (${user.nickname})`
              : group.operatorId ?? 'Noma’lum operator',
              handledOrders: group._count ?? 0,
          };
        })
        .sort((a, b) => b.handledOrders - a.handledOrders)
        .slice(0, 10),
    };
  }

  async getTrends(days = 30) {
    const rangeDays = Math.max(1, Math.min(days, 90));
    const rangeStart = this.startOfDay(this.subtractDays(new Date(), rangeDays - 1));
    const dateKeys = this.getDateKeys(rangeStart, rangeDays);

      const [leads, orders, payouts, transactions, operatorStatusGroups] =
        await this.prisma.$transaction([
          this.prisma.lead.findMany({
            where: { createdAt: { gte: rangeStart } },
            select: { createdAt: true },
          }),
          this.prisma.order.findMany({
            where: { createdAt: { gte: rangeStart } },
            select: { createdAt: true, status: true, amount: true },
          }),
          this.prisma.payoutRequest.findMany({
            where: {
              status: {
                in: [PayoutStatus.APPROVED, PayoutStatus.REJECTED, PayoutStatus.PENDING],
              },
              createdAt: { gte: rangeStart },
            },
            select: { createdAt: true, status: true, amount: true },
          }),
          this.prisma.transaction.findMany({
            where: {
              createdAt: { gte: rangeStart },
            },
            select: { createdAt: true, amount: true, type: true },
          }),
          this.prisma.order.groupBy({
            by: ['operatorId', 'status'],
            where: {
              operatorId: { not: undefined },
              updatedAt: { gte: rangeStart },
            },
            _count: true,
            orderBy: [
              { operatorId: 'asc' },
              { status: 'asc' },
            ],
          }),
        ]);

    const dailyLeads = this.zeroFill(dateKeys, leads.map((lead) => lead.createdAt));
    const dailyOrders = this.zeroFill(
      dateKeys,
      orders.map((order) => order.createdAt),
    );
    const dailyRevenue = this.zeroFillSum(
      dateKeys,
      orders
        .filter((order) => order.status === OrderStatus.DELIVERED)
        .map((order) => ({ date: order.createdAt, amount: this.toNumber(order.amount) })),
    );
    const payoutTrend = this.zeroFillSum(
      dateKeys,
      payouts
        .filter((payout) => payout.status === PayoutStatus.APPROVED)
        .map((payout) => ({ date: payout.createdAt, amount: this.toNumber(payout.amount) })),
    );

    const operatorMap = new Map<
      string,
      {
        id: string;
        counts: Partial<Record<OrderStatus, number>>;
      }
    >();

    for (const group of operatorStatusGroups) {
      const operatorId = group.operatorId ?? 'UNKNOWN';
        const entry =
          operatorMap.get(operatorId) ??
          {
            id: operatorId,
            counts: {},
          };
        entry.counts[group.status] = (entry.counts[group.status] ?? 0) + (group._count ?? 0);
      operatorMap.set(operatorId, entry);
    }

    const operatorIds = Array.from(operatorMap.keys()).filter((id) => id !== 'UNKNOWN');
    const operatorUsers = operatorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: operatorIds } },
          select: { id: true, firstName: true, nickname: true },
        })
      : [];

    const operatorHeatmap = Array.from(operatorMap.values()).map((entry) => {
      const user = operatorUsers.find((candidate) => candidate.id === entry.id);
      const total =
        (entry.counts[OrderStatus.PACKING] ?? 0) +
        (entry.counts[OrderStatus.SHIPPED] ?? 0) +
        (entry.counts[OrderStatus.DELIVERED] ?? 0) +
        (entry.counts[OrderStatus.RETURNED] ?? 0);
      return {
        id: entry.id,
        name: user
          ? `${user.firstName} (${user.nickname})`
          : entry.id === 'UNKNOWN'
            ? 'Operator biriktirilmagan'
            : 'Noma’lum operator',
        total,
        delivered: entry.counts[OrderStatus.DELIVERED] ?? 0,
        returned: entry.counts[OrderStatus.RETURNED] ?? 0,
        progress: total > 0 ? Number((((entry.counts[OrderStatus.DELIVERED] ?? 0) / total) * 100).toFixed(1)) : 0,
      };
    });

    return {
      range: {
        days: rangeDays,
        since: rangeStart,
      },
      daily: {
        leads: dailyLeads,
        orders: dailyOrders,
        revenue: dailyRevenue,
        payouts: payoutTrend,
      },
      transactions: transactions.length,
      operatorHeatmap: operatorHeatmap.sort((a, b) => b.delivered - a.delivered),
    };
  }

  private zeroFill(dates: string[], values: Date[]) {
    const counts = new Map<string, number>();
    values.forEach((date) => {
      const key = this.formatDate(date);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return dates.map((key) => ({
      date: key,
      value: counts.get(key) ?? 0,
    }));
  }

  private zeroFillSum(dates: string[], values: { date: Date; amount: number }[]) {
    const totals = new Map<string, number>();
    values.forEach((entry) => {
      const key = this.formatDate(entry.date);
      totals.set(key, (totals.get(key) ?? 0) + entry.amount);
    });
    return dates.map((key) => ({
      date: key,
      value: Number((totals.get(key) ?? 0).toFixed(2)),
    }));
  }

  private getDateKeys(start: Date, length: number) {
    const result: string[] = [];
    for (let index = 0; index < length; index += 1) {
      const date = this.addDays(start, index);
      result.push(this.formatDate(date));
    }
    return result;
  }

  private formatDate(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private startOfDay(value: Date) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private addDays(value: Date, amount: number) {
    const date = new Date(value);
    date.setDate(date.getDate() + amount);
    return date;
  }

  private subtractDays(value: Date, amount: number) {
    return this.addDays(value, -amount);
  }

  private toNumber(value: Numeric) {
    if (value instanceof Prisma.Decimal) {
      return Number(value.toFixed(2));
    }
    if (typeof value === 'number') {
      return value;
    }
    return 0;
  }
}
