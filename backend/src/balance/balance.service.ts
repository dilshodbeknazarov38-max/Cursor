import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class BalanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserOverview(userId: string) {
    const [balance, transactions] = await Promise.all([
      this.ensureUserBalance(userId),
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      holdBalance: balance.holdBalance.toFixed(2),
      mainBalance: balance.mainBalance.toFixed(2),
      transactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: new Prisma.Decimal(tx.amount).toFixed(2),
        meta: tx.meta,
        createdAt: tx.createdAt,
      })),
    };
  }

  async ensureUserBalance(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    return client.userBalance.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async getUserBalanceOrThrow(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const balance = await client.userBalance.findUnique({
      where: { userId },
    });
    if (!balance) {
      throw new NotFoundException('Balans ma’lumoti topilmadi.');
    }
    return balance;
  }

  async adjustMainBalance(
    userId: string,
    amount: Prisma.Decimal | number | string,
    direction: 'INCREASE' | 'DECREASE',
    tx: Prisma.TransactionClient,
  ) {
    const decimalAmount = new Prisma.Decimal(amount);
    if (decimalAmount.lte(0)) {
      throw new BadRequestException('Summani musbat qiymatda kiriting.');
    }

    const balance = await this.ensureUserBalance(userId, tx);
    const current = new Prisma.Decimal(balance.mainBalance ?? 0);
    const next =
      direction === 'INCREASE'
        ? current.plus(decimalAmount)
        : current.minus(decimalAmount);

    if (next.lt(0)) {
      throw new BadRequestException('Balansda mablag‘ yetarli emas.');
    }

    return tx.userBalance.update({
      where: { userId },
      data: { mainBalance: next },
    });
  }
}
