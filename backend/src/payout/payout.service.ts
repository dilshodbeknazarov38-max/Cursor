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

    const sanitizedCardNumber = this.normalizeCardNumber(dto.cardNumber);
    const normalizedCardHolder = this.normalizeCardHolder(dto.cardHolder);

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
          cardNumber: sanitizedCardNumber,
          cardHolder: normalizedCardHolder,
          comment: dto.comment?.trim() ?? null,
          status: PayoutStatus.PENDING,
        },
      });

      await this.balanceService.adjustMainBalance(userId, amountDecimal, 'DECREASE', tx);

      await this.transactionsService.record({
        userId,
        type: TransactionType.PAYOUT_REQUEST,
        amount: amountDecimal,
        meta: {
          payoutId: createdPayout.id,
          cardLast4: sanitizedCardNumber.slice(-4),
        },
        tx,
      });

      return createdPayout;
    });

    const balance = await this.balanceService.getUserOverview(userId);

    return {
      message: 'To‘lov so‘rovi yuborildi.',
      payout: this.mapPayout(payout),
      balance,
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

      return {
        payout: updated,
        userId: payout.userId,
      };
    });

    const balance = await this.balanceService.getUserOverview(result.userId);

    // Placeholder for async notification integration
    console.log('[Payout] Telegram notify pending for approval:', id);

    return {
      message: 'Payout so‘rovi tasdiqlandi.',
      payout: this.mapPayout(result.payout),
      balance,
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

      return {
        payout: updated,
        userId: payout.userId,
      };
    });

    const balance = await this.balanceService.getUserOverview(result.userId);

    return {
      message: 'Payout so‘rovi rad etildi va mablag‘ qaytarildi.',
      payout: this.mapPayout(result.payout),
      balance,
    };
  }

  private mapPayout<T extends { amount: Prisma.Decimal }>(payout: T) {
    return {
      ...payout,
      amount: new Prisma.Decimal(payout.amount).toFixed(2),
    };
  }

  private normalizeCardNumber(cardNumber: string) {
    const digitsOnly = cardNumber.replace(/\D/g, '');
    if (digitsOnly.length !== 16) {
      throw new BadRequestException('Karta raqami 16 ta raqamdan iborat bo‘lishi kerak.');
    }
    return digitsOnly;
  }

  private normalizeCardHolder(cardHolder: string) {
    const normalized = cardHolder.trim().replace(/\s+/g, ' ');
    if (normalized.length < 3 || normalized.length > 64) {
      throw new BadRequestException('Karta egasi ismi 3-64 belgi oralig‘ida bo‘lishi kerak.');
    }
    return normalized.toUpperCase();
  }
}
