import { Injectable } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

interface FraudSummary {
  duplicatePhones: number;
  suspiciousIps: number;
  sharedCards: number;
  highValueTransactions: number;
  fastCancelledLeads: number;
  openFraudFlags: number;
}

@Injectable()
export class FraudService {
  private readonly duplicatePhoneThreshold = 4;
  private readonly suspiciousIpThreshold = 5;
  private readonly sharedCardThreshold = 3;
  private readonly highValueTransactionLimit = new Prisma.Decimal(5_000_000);
  private readonly lookbackDays = 30;

  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const lookbackDate = this.subtractDays(new Date(), this.lookbackDays);

    const [
      duplicatePhoneGroups,
      ipGroups,
      cardGroups,
      highValueTransactions,
      cancelledLeads,
      openFraudChecks,
    ] = await this.prisma.$transaction([
      this.prisma.lead.groupBy({
        by: ['phone'],
        where: {
          createdAt: { gte: lookbackDate },
        },
        _count: { _all: true },
        having: {
          _count: {
            _all: { gt: this.duplicatePhoneThreshold - 1 },
          },
        },
      }),
      this.prisma.lead.groupBy({
        by: ['sourceIp'],
        where: {
          sourceIp: { not: null },
          createdAt: { gte: lookbackDate },
        },
        _count: { _all: true },
        having: {
          _count: {
            _all: { gt: this.suspiciousIpThreshold - 1 },
          },
        },
      }),
      this.prisma.payoutRequest.groupBy({
        by: ['cardNumber'],
        where: {
          cardNumber: { not: null },
          createdAt: { gte: lookbackDate },
        },
        _count: { _all: true },
        having: {
          _count: {
            _all: { gt: this.sharedCardThreshold - 1 },
          },
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          amount: { gte: this.highValueTransactionLimit },
          createdAt: { gte: lookbackDate },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          createdAt: true,
          amount: true,
          type: true,
          user: {
            select: {
              id: true,
              firstName: true,
              nickname: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.lead.findMany({
        where: {
          status: LeadStatus.CANCELLED,
          updatedAt: { gte: lookbackDate },
        },
        select: {
          id: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          sourceIp: true,
          flow: {
            select: { id: true, title: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.balanceFraudCheck.findMany({
        where: { resolvedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          createdAt: true,
          user: {
            select: { id: true, firstName: true, nickname: true, phone: true },
          },
          reason: true,
          status: true,
          metadata: true,
        },
      }),
    ]);

    const duplicatePhones = await this.buildDuplicatePhoneDetails(
      duplicatePhoneGroups,
      lookbackDate,
    );

    const suspiciousIps = await this.buildSuspiciousIpDetails(ipGroups, lookbackDate);
    const sharedCards = await this.buildSharedCardDetails(cardGroups);

    const fastCancelledLeads = cancelledLeads
      .filter(
        (lead) =>
          lead.updatedAt.getTime() - lead.createdAt.getTime() <= 5 * 60 * 1000,
      )
      .slice(0, 20);

    const summary: FraudSummary = {
      duplicatePhones: duplicatePhones.length,
      suspiciousIps: suspiciousIps.length,
      sharedCards: sharedCards.length,
      highValueTransactions: highValueTransactions.length,
      fastCancelledLeads: fastCancelledLeads.length,
      openFraudFlags: openFraudChecks.length,
    };

    return {
      summary,
      duplicatePhones,
      suspiciousIps,
      sharedCards,
      highValueTransactions: highValueTransactions.map((transaction) => ({
        id: transaction.id,
        createdAt: transaction.createdAt,
        amount: Number(transaction.amount.toFixed(2)),
        type: transaction.type,
        user: transaction.user
          ? {
              id: transaction.user.id,
              name: `${transaction.user.firstName} (${transaction.user.nickname})`,
              phone: transaction.user.phone,
            }
          : null,
      })),
      fastCancelledLeads: fastCancelledLeads.map((lead) => ({
        id: lead.id,
        phone: lead.phone,
        lifetimeMs: lead.updatedAt.getTime() - lead.createdAt.getTime(),
        sourceIp: lead.sourceIp,
        flow: lead.flow
          ? { id: lead.flow.id, title: lead.flow.title }
          : null,
      })),
      openFraudChecks,
      metadata: {
        lookbackDays: this.lookbackDays,
      },
    };
  }

  private async buildDuplicatePhoneDetails(
    groups: Array<{ phone: string | null; _count: { _all: number } }>,
    lookbackDate: Date,
  ) {
    const phones = groups
      .map((group) => group.phone)
      .filter((value): value is string => Boolean(value));
    if (phones.length === 0) {
      return [];
    }

    const leads = await this.prisma.lead.findMany({
      where: {
        phone: { in: phones },
        createdAt: { gte: lookbackDate },
      },
      select: {
        id: true,
        phone: true,
        createdAt: true,
        sourceIp: true,
        flow: {
          select: { id: true, title: true },
        },
        targetolog: {
          select: { id: true, firstName: true, nickname: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const grouped = new Map<
      string,
      {
        phone: string;
        count: number;
        leads: typeof leads;
      }
    >();

    for (const phone of phones) {
      grouped.set(phone, {
        phone,
        count: groups.find((item) => item.phone === phone)?._count._all ?? 0,
        leads: [],
      });
    }

    for (const lead of leads) {
      const entry = grouped.get(lead.phone);
      if (entry) {
        entry.leads.push(lead);
      }
    }

    return Array.from(grouped.values())
      .map((entry) => ({
        phone: entry.phone,
        count: entry.count,
        leads: entry.leads.slice(0, 10),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private async buildSuspiciousIpDetails(
    groups: Array<{ sourceIp: string | null; _count: { _all: number } }>,
    lookbackDate: Date,
  ) {
    const ips = groups
      .map((group) => group.sourceIp)
      .filter((value): value is string => Boolean(value));
    if (ips.length === 0) {
      return [];
    }

    const leads = await this.prisma.lead.findMany({
      where: {
        sourceIp: { in: ips },
        createdAt: { gte: lookbackDate },
      },
      select: {
        id: true,
        phone: true,
        createdAt: true,
        sourceIp: true,
        flow: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const grouped = new Map<
      string,
      {
        ip: string;
        count: number;
        leads: typeof leads;
      }
    >();

    for (const ip of ips) {
      grouped.set(ip, {
        ip,
        count: groups.find((candidate) => candidate.sourceIp === ip)?._count._all ?? 0,
        leads: [],
      });
    }

    for (const lead of leads) {
      if (!lead.sourceIp) continue;
      const entry = grouped.get(lead.sourceIp);
      if (entry) {
        entry.leads.push(lead);
      }
    }

    return Array.from(grouped.values())
      .map((entry) => ({
        ip: entry.ip,
        count: entry.count,
        leads: entry.leads.slice(0, 10),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private async buildSharedCardDetails(
    groups: Array<{ cardNumber: string | null; _count: { _all: number } }>,
  ) {
    const cards = groups
      .map((group) => group.cardNumber)
      .filter((value): value is string => Boolean(value));
    if (cards.length === 0) {
      return [];
    }

    const payouts = await this.prisma.payoutRequest.findMany({
      where: {
        cardNumber: { in: cards },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        cardNumber: true,
        createdAt: true,
        user: {
          select: { id: true, firstName: true, nickname: true, phone: true },
        },
      },
    });

    const grouped = new Map<
      string,
      {
        cardNumber: string;
        count: number;
        payouts: typeof payouts;
      }
    >();

    for (const card of cards) {
      grouped.set(card, {
        cardNumber: card,
        count: groups.find((candidate) => candidate.cardNumber === card)?._count._all ?? 0,
        payouts: [],
      });
    }

    for (const payout of payouts) {
      if (!payout.cardNumber) continue;
      const entry = grouped.get(payout.cardNumber);
      if (entry) {
        entry.payouts.push(payout);
      }
    }

    return Array.from(grouped.values())
      .map((entry) => ({
        cardNumber: entry.cardNumber,
        count: entry.count,
        payouts: entry.payouts.slice(0, 10).map((payout) => ({
          id: payout.id,
          status: payout.status,
          amount: Number(payout.amount.toFixed(2)),
          createdAt: payout.createdAt,
          user: payout.user
            ? {
                id: payout.user.id,
                name: `${payout.user.firstName} (${payout.user.nickname})`,
                phone: payout.user.phone,
              }
            : null,
        })),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private subtractDays(value: Date, days: number) {
    const result = new Date(value);
    result.setDate(result.getDate() - days);
    return result;
  }
}
