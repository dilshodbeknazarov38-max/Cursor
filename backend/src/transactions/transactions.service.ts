import { Injectable } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

type RecordTransactionParams = {
  userId: string;
  type: TransactionType;
  amount: Prisma.Decimal | number | string;
  meta?: Prisma.InputJsonValue;
  tx?: Prisma.TransactionClient;
};

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: RecordTransactionParams) {
    const amountDecimal = new Prisma.Decimal(params.amount);
    const client = params.tx ?? this.prisma;

    return client.transaction.create({
      data: {
        userId: params.userId,
        type: params.type,
        amount: amountDecimal,
        meta: params.meta ?? Prisma.JsonNull,
      },
    });
  }
}
