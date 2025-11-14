import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { TransactionsService } from '@/transactions/transactions.service';

@Injectable()
export class BalanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async getUserOverview(userId: string) {
    const [balance, transactions] = await Promise.all([
      this.ensureUserBalance(userId),
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const hold = new Prisma.Decimal(balance.holdBalance ?? 0);
    const main = new Prisma.Decimal(balance.mainBalance ?? 0);

    return {
      holdBalance: hold.toFixed(2),
      mainBalance: main.toFixed(2),
      availableForPayout: main.toFixed(2),
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

  async addHoldBalance(
    userId: string,
    amount: Prisma.Decimal | number | string,
    meta?: Prisma.InputJsonValue,
    tx?: Prisma.TransactionClient,
  ) {
    const decimalAmount = this.ensurePositive(amount);

    const runner = async (client: Prisma.TransactionClient) => {
      const balance = await this.ensureUserBalance(userId, client);
      const currentHold = new Prisma.Decimal(balance.holdBalance ?? 0);
      const nextHold = currentHold.plus(decimalAmount);

      await client.userBalance.update({
        where: { userId },
        data: { holdBalance: nextHold },
      });

      await this.transactionsService.record({
        userId,
        type: TransactionType.HOLD_ADD,
        amount: decimalAmount,
        meta,
        tx: client,
      });
    };

    if (tx) {
      await runner(tx);
      return this.ensureUserBalance(userId, tx);
    }

    await this.prisma.$transaction(async (client) => {
      await runner(client);
    });

    return this.ensureUserBalance(userId);
  }

  async releaseHoldToMain(
    userId: string,
    amount: Prisma.Decimal | number | string,
    meta?: Prisma.InputJsonValue,
    tx?: Prisma.TransactionClient,
  ) {
    const decimalAmount = this.ensurePositive(amount);

    const runner = async (client: Prisma.TransactionClient) => {
      const balance = await this.ensureUserBalance(userId, client);
      const currentHold = new Prisma.Decimal(balance.holdBalance ?? 0);

      if (currentHold.lt(decimalAmount)) {
        throw new BadRequestException('Hold balansda mablag‘ yetarli emas.');
      }

      const nextHold = currentHold.minus(decimalAmount);

      await client.userBalance.update({
        where: { userId },
        data: { holdBalance: nextHold },
      });

      await this.adjustMainBalance(userId, decimalAmount, 'INCREASE', client);

      await this.transactionsService.record({
        userId,
        type: TransactionType.HOLD_RELEASE,
        amount: decimalAmount,
        meta,
        tx: client,
      });
    };

    if (tx) {
      await runner(tx);
      return this.ensureUserBalance(userId, tx);
    }

    await this.prisma.$transaction(async (client) => {
      await runner(client);
    });

    return this.ensureUserBalance(userId);
  }

  async removeHold(
    userId: string,
    amount: Prisma.Decimal | number | string,
    meta?: Prisma.InputJsonValue,
    tx?: Prisma.TransactionClient,
  ) {
    const decimalAmount = this.ensurePositive(amount);

    const runner = async (client: Prisma.TransactionClient) => {
      const balance = await this.ensureUserBalance(userId, client);
      const currentHold = new Prisma.Decimal(balance.holdBalance ?? 0);

      if (currentHold.lt(decimalAmount)) {
        throw new BadRequestException('Hold balansda yetarli mablag‘ topilmadi.');
      }

      const nextHold = currentHold.minus(decimalAmount);

      await client.userBalance.update({
        where: { userId },
        data: { holdBalance: nextHold },
      });

      await this.transactionsService.record({
        userId,
        type: TransactionType.HOLD_REMOVE,
        amount: decimalAmount,
        meta,
        tx: client,
      });
    };

    if (tx) {
      await runner(tx);
      return this.ensureUserBalance(userId, tx);
    }

    await this.prisma.$transaction(async (client) => {
      await runner(client);
    });

    return this.ensureUserBalance(userId);
  }

  async adjustMainBalance(
    userId: string,
    amount: Prisma.Decimal | number | string,
    direction: 'INCREASE' | 'DECREASE',
    tx: Prisma.TransactionClient,
  ) {
    const decimalAmount = this.ensurePositive(amount);

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

  private ensurePositive(amount: Prisma.Decimal | number | string) {
    const decimalAmount = new Prisma.Decimal(amount);
    if (decimalAmount.lte(0)) {
      throw new BadRequestException('Summani musbat qiymatda kiriting.');
    }
    return decimalAmount;
  }
}
