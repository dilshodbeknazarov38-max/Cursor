import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PayoutStatus,
  Prisma,
  TransactionType,
} from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

import { BalanceService } from '@/balance/balance.service';
import { TransactionsService } from '@/transactions/transactions.service';

import { CreatePayoutDto } from './dto/create-payout.dto';
import { QueryAdminPayoutsDto } from './dto/query-admin-payouts.dto';

@Injectable()
export class PayoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly balanceService: BalanceService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async getMyPayouts(userId: string) {
    const payouts = await this.prisma.payoutRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return payouts.map((payout) => this.mapPayout(payout));
  }

  async createPayout(userId: string, dto: CreatePayoutDto) {
    const amountDecimal = new Prisma.Decimal(dto.amount);
    if (amountDecimal.lte(0)) {
      throw new BadRequestException('Summani musbat qiymatda kiriting.');
    }

    const payout = await this.prisma.$transaction(async (tx) => {
      const balance = await this.balanceService.ensureUserBalance(userId, tx);
      const mainBalance = new Prisma.Decimal(balance.mainBalance ?? 0);
      if (mainBalance.lt(amountDecimal)) {
        throw new BadRequestException('Balansda yetarli mablag‘ mavjud emas.');
      }

      const createdPayout = await tx.payoutRequest.create({
        data: {
          userId,
          amount: amountDecimal,
          cardNumber: dto.cardNumber,
          cardHolder: dto.cardHolder,
          comment: dto.comment,
          status: PayoutStatus.PENDING,
        },
      });

      await this.balanceService.adjustMainBalance(
        userId,
        amountDecimal,
        'DECREASE',
        tx,
      );

      await this.transactionsService.record(
        {
          userId,
          type: TransactionType.PAYOUT_REQUEST,
          amount: amountDecimal,
          meta: {
            payoutId: createdPayout.id,
            cardNumber: dto.cardNumber,
          },
          tx,
        },
      );

      return createdPayout;
    });

    return {
      message: 'To‘lov so‘rovi yuborildi.',
      payout: this.mapPayout(payout),
    };
  }

  async getAdminPayouts(query: QueryAdminPayoutsDto) {
    const where: Prisma.PayoutRequestWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = query.dateFrom;
      }
      if (query.dateTo) {
        where.createdAt.lte = query.dateTo;
      }
    }

    const payouts = await this.prisma.payoutRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            nickname: true,
          },
        },
      },
    });

    return payouts.map((payout) => ({
      ...this.mapPayout(payout),
      user: payout.user
        ? {
            id: payout.user.id,
            firstName: payout.user.firstName,
            lastName: payout.user.lastName,
            email: payout.user.email,
            phone: payout.user.phone,
            nickname: payout.user.nickname,
          }
        : null,
    }));
  }

  async approvePayout(id: string, actorId?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({
        where: { id },
      });
      if (!payout) {
        throw new NotFoundException('Payout so‘rovi topilmadi.');
      }
      if (payout.status !== PayoutStatus.PENDING) {
        throw new BadRequestException('Faqat kutilayotgan so‘rovni tasdiqlash mumkin.');
      }

      const updated = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: PayoutStatus.APPROVED,
        },
      });

      await this.transactionsService.record({
        userId: payout.userId,
        type: TransactionType.PAYOUT_APPROVED,
        amount: payout.amount,
        meta: {
          payoutId: payout.id,
          approvedBy: actorId,
        },
        tx,
      });

      return updated;
    });

    // Placeholder for async notification integration
    console.log('[Payout] Telegram notify pending for approval:', id);

    return {
      message: 'Payout so‘rovi tasdiqlandi.',
      payout: this.mapPayout(result),
    };
  }

  async rejectPayout(id: string, actorId?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.findUnique({
        where: { id },
      });
      if (!payout) {
        throw new NotFoundException('Payout so‘rovi topilmadi.');
      }
      if (payout.status !== PayoutStatus.PENDING) {
        throw new BadRequestException('Faqat kutilayotgan so‘rovni rad etish mumkin.');
      }

      const updated = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: PayoutStatus.REJECTED,
        },
      });

      await this.balanceService.adjustMainBalance(
        payout.userId,
        payout.amount,
        'INCREASE',
        tx,
      );

      await this.transactionsService.record({
        userId: payout.userId,
        type: TransactionType.PAYOUT_REJECTED,
        amount: payout.amount,
        meta: {
          payoutId: payout.id,
          rejectedBy: actorId,
        },
        tx,
      });

      return updated;
    });

    return {
      message: 'Payout so‘rovi rad etildi va mablag‘ qaytarildi.',
      payout: this.mapPayout(result),
    };
  }

  private mapPayout<T extends { amount: Prisma.Decimal }>(payout: T) {
    return {
      ...payout,
      amount: new Prisma.Decimal(payout.amount).toFixed(2),
    };
  }
}
