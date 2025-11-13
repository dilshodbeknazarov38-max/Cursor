import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BalanceAccountType,
  BalanceTransaction,
  BalanceTransactionType,
  FraudCheckStatus,
  NotificationType,
  PayoutStatus,
  Prisma,
} from '@prisma/client';
import { Observable, Subject } from 'rxjs';

import { ActivityService } from '@/activity/activity.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { PrismaService } from '@/prisma/prisma.service';

import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { ResolveFraudDto } from './dto/resolve-fraud.dto';

type ActorContext = {
  actorId?: string;
};

type UserSummary = {
  id: string;
  firstName: string;
  nickname: string;
  role: {
    slug: string;
  };
  salesSharePercent: Prisma.Decimal;
};

type ApplyTransactionParams = {
  userId: string;
  accountType: BalanceAccountType;
  amount: Prisma.Decimal | number | string;
  transactionType: BalanceTransactionType;
  isCredit: boolean;
  note?: string;
  metadata?: Prisma.InputJsonValue;
  leadId?: string;
  payoutId?: string;
  actorId?: string;
  tx?: Prisma.TransactionClient;
  user?: UserSummary;
};

type TransferHoldParams = {
  userId: string;
  amount: Prisma.Decimal | number | string;
  leadId: string;
  productName: string;
  note?: string;
  metadata?: Prisma.InputJsonValue;
  actorId?: string;
  holdAccountType: BalanceAccountType;
  mainAccountType: BalanceAccountType;
};

type PayoutUserSummary = {
  firstName?: string | null;
  nickname?: string | null;
  phone?: string | null;
};

type PayoutNotificationPayload = {
  id: string;
  userId: string;
  amount: Prisma.Decimal | number | string;
  cardNumber?: string | null;
  cardHolder?: string | null;
  user?: PayoutUserSummary;
};

type PayoutLimitsConfig = {
  minAmount: number;
  dailyAmountLimit: number;
  monthlyAmountLimit: number;
  dailyRequestLimit: number;
};

type BalanceStreamEvent = {
  type: 'BALANCE_UPDATED';
};

const FRAUD_IP_THRESHOLD = 15;
const FRAUD_CARD_SCORE = 40;
const FRAUD_IP_SCORE = 20;
const FRAUD_SCORE_ALERT = 50;

@Injectable()
export class BalancesService {
  private readonly balanceStreams = new Map<
    string,
    Subject<BalanceStreamEvent>
  >();

  private readonly payoutStatusesForLimits: PayoutStatus[] = [
    PayoutStatus.PENDING,
    PayoutStatus.APPROVED,
    PayoutStatus.PAID,
  ];

  private readonly ROLE_ACCOUNT_MAP: Record<string, BalanceAccountType[]> = {
    TARGETOLOG: [
      BalanceAccountType.TARGETOLOG_HOLD,
      BalanceAccountType.TARGETOLOG_MAIN,
    ],
    OPERATOR: [BalanceAccountType.OPERATOR_HOLD, BalanceAccountType.OPERATOR_MAIN],
    SOTUVCHI: [BalanceAccountType.SELLER_MAIN],
    SELLER_ADMIN: [BalanceAccountType.SELLER_MAIN],
    TARGET_ADMIN: [BalanceAccountType.GENERIC_MAIN],
    OPER_ADMIN: [BalanceAccountType.GENERIC_MAIN],
    SKLAD_ADMIN: [BalanceAccountType.GENERIC_MAIN],
    BLOGGER: [BalanceAccountType.BLOGGER_MAIN],
    BLOGGER_ADMIN: [BalanceAccountType.BLOGGER_MAIN],
    MANAGER: [BalanceAccountType.MANAGER_MAIN],
    MANAGER_ADMIN: [BalanceAccountType.MANAGER_MAIN],
  };

  private readonly ROLE_MAIN_ACCOUNT: Record<string, BalanceAccountType> = {
    TARGETOLOG: BalanceAccountType.TARGETOLOG_MAIN,
    OPERATOR: BalanceAccountType.OPERATOR_MAIN,
    SOTUVCHI: BalanceAccountType.SELLER_MAIN,
    SELLER_ADMIN: BalanceAccountType.SELLER_MAIN,
    BLOGGER: BalanceAccountType.BLOGGER_MAIN,
    BLOGGER_ADMIN: BalanceAccountType.BLOGGER_MAIN,
    MANAGER: BalanceAccountType.MANAGER_MAIN,
    MANAGER_ADMIN: BalanceAccountType.MANAGER_MAIN,
    TARGET_ADMIN: BalanceAccountType.GENERIC_MAIN,
    OPER_ADMIN: BalanceAccountType.GENERIC_MAIN,
    SKLAD_ADMIN: BalanceAccountType.GENERIC_MAIN,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async getUserBalances(userId: string) {
    const [accounts, transactions] = await Promise.all([
      this.prisma.balanceAccount.findMany({
        where: { userId },
        orderBy: { type: 'asc' },
      }),
      this.prisma.balanceTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          account: {
            select: {
              type: true,
            },
          },
        },
      }),
    ]);

    const total = accounts.reduce(
      (sum, account) =>
        sum.plus(new Prisma.Decimal(account.amount ?? 0)),
      new Prisma.Decimal(0),
    );

    return {
      userId,
      total: total.toFixed(2),
      accounts: accounts.map((account) => ({
        id: account.id,
        type: account.type,
        amount: new Prisma.Decimal(account.amount ?? 0).toFixed(2),
        currency: account.currency,
        updatedAt: account.updatedAt,
      })),
      recentTransactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        accountType: tx.account?.type,
        amount: new Prisma.Decimal(tx.amount ?? 0).toFixed(2),
        isCredit: tx.isCredit,
        createdAt: tx.createdAt,
        leadId: tx.leadId,
        payoutId: tx.payoutId,
        metadata: tx.metadata,
        note: tx.note,
      })),
    };
  }

  async getUserTransactions(
    userId: string,
    query: QueryTransactionsDto,
  ) {
    const where: Prisma.BalanceTransactionWhereInput = {
      userId,
    };

    if (query.accountType) {
      where.account = { type: query.accountType };
    }

    const limit = query.limit ?? 50;

    const transactions = await this.prisma.balanceTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          select: {
            type: true,
          },
        },
      },
      take: limit,
    });

    return transactions.map((tx) => ({
      id: tx.id,
      accountType: tx.account.type,
      type: tx.type,
      amount: new Prisma.Decimal(tx.amount ?? 0).toFixed(2),
      balanceBefore: new Prisma.Decimal(tx.balanceBefore ?? 0).toFixed(2),
      balanceAfter: new Prisma.Decimal(tx.balanceAfter ?? 0).toFixed(2),
      isCredit: tx.isCredit,
      createdAt: tx.createdAt,
      leadId: tx.leadId,
      payoutId: tx.payoutId,
      note: tx.note,
      metadata: tx.metadata,
    }));
  }

  async adminAdjustBalance(dto: AdjustBalanceDto, context: ActorContext) {
    const amount = new Prisma.Decimal(dto.amount);
    const isCredit = dto.operation === 'INCREASE';

    const result = await this.applyTransaction({
      userId: dto.userId,
      accountType: dto.accountType,
      amount,
      transactionType: BalanceTransactionType.ADMIN_ADJUSTMENT,
      isCredit,
      note: dto.reason,
      metadata: dto.note ? { note: dto.note } : undefined,
      actorId: context.actorId,
    });

    return {
      message: 'Balans yangilandi.',
      transaction: this.serializeTransaction(result.transaction),
    };
  }

  async handleLeadApproved(leadId: string, actorId?: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            cpaTargetolog: true,
            cpaOperator: true,
          },
        },
        targetolog: {
          select: {
            id: true,
            role: { select: { slug: true } },
            salesSharePercent: true,
          },
        },
      },
    });
    if (!lead) {
      throw new NotFoundException('Lead topilmadi.');
    }

    const productAmount = lead.product.cpaTargetolog
      ? new Prisma.Decimal(lead.product.cpaTargetolog)
      : new Prisma.Decimal(0);

    if (productAmount.gt(0)) {
      const alreadyCredited = await this.prisma.balanceTransaction.findFirst({
        where: {
          userId: lead.targetologId,
          leadId,
          type: BalanceTransactionType.LEAD_ACCEPTED,
          account: { type: BalanceAccountType.TARGETOLOG_HOLD },
        },
      });

      if (!alreadyCredited) {
        await this.applyTransaction({
          userId: lead.targetologId,
          accountType: BalanceAccountType.TARGETOLOG_HOLD,
          amount: productAmount,
          transactionType: BalanceTransactionType.LEAD_ACCEPTED,
          isCredit: true,
          note: `Lead tasdiqlandi: ${lead.product.name}`,
          metadata: {
            productId: lead.product.id,
            leadId,
          },
          leadId,
          actorId,
        });
      }
    }

    const orderWithOperator = await this.prisma.order.findFirst({
      where: {
        leadId,
        operatorId: { not: null },
      },
      include: {
        operator: {
          select: {
            id: true,
            role: { select: { slug: true } },
          },
        },
        product: {
          select: {
            cpaOperator: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (
      orderWithOperator?.operator?.id &&
      orderWithOperator.product.cpaOperator
    ) {
      const operatorAmount = new Prisma.Decimal(
        orderWithOperator.product.cpaOperator,
      );

      if (operatorAmount.gt(0)) {
        const alreadyCredited = await this.prisma.balanceTransaction.findFirst({
          where: {
            userId: orderWithOperator.operator.id,
            leadId,
            type: BalanceTransactionType.LEAD_ACCEPTED,
            account: { type: BalanceAccountType.OPERATOR_HOLD },
          },
        });

        if (!alreadyCredited) {
          await this.applyTransaction({
            userId: orderWithOperator.operator.id,
            accountType: BalanceAccountType.OPERATOR_HOLD,
            amount: operatorAmount,
            transactionType: BalanceTransactionType.LEAD_ACCEPTED,
            isCredit: true,
            note: `Lead operator tomonidan qabul qilindi.`,
            metadata: {
              leadId,
              productId: lead.product.id,
            },
            leadId,
            actorId,
          });
        }
      }
    }
  }

  private async detectCardReuseFraud(payload: {
    userId: string;
    transactionId: string;
    cardNumber?: string | null;
  }) {
    if (!payload.cardNumber) {
      return;
    }

    const duplicates = await this.prisma.payout.findMany({
      where: {
        cardNumber: payload.cardNumber,
        userId: { not: payload.userId },
        status: { in: this.payoutStatusesForLimits },
      },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
      },
      take: 5,
    });

    if (duplicates.length === 0) {
      return;
    }

    const score = FRAUD_CARD_SCORE + duplicates.length * 5;

    await this.openFraudCheck({
      userId: payload.userId,
      transactionId: payload.transactionId,
      reason: 'Bir karta raqami bir nechta foydalanuvchida ishlatilmoqda.',
      metadata: {
        cardNumber: this.maskCardNumber(payload.cardNumber),
        duplicates,
        score,
      },
    });
  }

  async evaluateLeadIpAbuse(userId: string, ip?: string | null) {
    if (!ip) {
      return;
    }

    const since = new Date(Date.now() - 1000 * 60 * 60 * 6);
    const suspectEvents = await this.prisma.activityLog.count({
      where: {
        userId,
        ip,
        action: 'Yangi lead yaratildi.',
        createdAt: {
          gte: since,
        },
      },
    });

    if (suspectEvents >= FRAUD_IP_THRESHOLD) {
      const score = FRAUD_IP_SCORE + (suspectEvents - FRAUD_IP_THRESHOLD) * 2;
      await this.openFraudCheck({
        userId,
        reason: `Bir IP manzildan ${suspectEvents} ta lead yaratildi.`,
        metadata: {
          ip,
          count: suspectEvents,
          score,
        },
      });
    }
  }

  async handleLeadCancelled(leadId: string, actorId?: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            cpaTargetolog: true,
            cpaOperator: true,
          },
        },
        targetolog: {
          select: {
            id: true,
            role: { select: { slug: true } },
          },
        },
      },
    });
    if (!lead) {
      throw new NotFoundException('Lead topilmadi.');
    }

    const holdAmount = lead.product.cpaTargetolog
      ? new Prisma.Decimal(lead.product.cpaTargetolog)
      : new Prisma.Decimal(0);

    if (holdAmount.gt(0)) {
      const alreadyCancelled = await this.prisma.balanceTransaction.findFirst({
        where: {
          userId: lead.targetologId,
          leadId,
          type: BalanceTransactionType.LEAD_CANCELLED,
          account: { type: BalanceAccountType.TARGETOLOG_HOLD },
        },
      });
      if (!alreadyCancelled) {
        await this.applyTransaction({
          userId: lead.targetologId,
          accountType: BalanceAccountType.TARGETOLOG_HOLD,
          amount: holdAmount,
          transactionType: BalanceTransactionType.LEAD_CANCELLED,
          isCredit: false,
          note: `Lead bekor qilindi: ${lead.product.name}`,
          metadata: {
            leadId,
            productId: lead.product.id,
          },
          leadId,
          actorId,
        });
      }

      const saleExists = await this.prisma.balanceTransaction.findFirst({
        where: {
          userId: lead.targetologId,
          leadId,
          type: BalanceTransactionType.LEAD_SOLD,
          account: { type: BalanceAccountType.TARGETOLOG_MAIN },
        },
      });

      if (saleExists) {
        await this.openFraudCheck({
          userId: lead.targetologId,
          transactionId: saleExists.id,
          reason:
            'Lead bekor qilindi, ammo asosiy balansga o‘tkazilgan mablag‘ mavjud.',
          metadata: {
            leadId,
            productId: lead.product.id,
          },
        });
      }
    }

    const orderWithOperator = await this.prisma.order.findFirst({
      where: {
        leadId,
        operatorId: { not: null },
      },
      include: {
        operator: {
          select: {
            id: true,
            role: { select: { slug: true } },
          },
        },
        product: {
          select: {
            cpaOperator: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (
      orderWithOperator?.operator?.id &&
      orderWithOperator.product.cpaOperator
    ) {
      const operatorAmount = new Prisma.Decimal(
        orderWithOperator.product.cpaOperator,
      );

      if (operatorAmount.gt(0)) {
        const alreadyCancelled = await this.prisma.balanceTransaction.findFirst({
          where: {
            userId: orderWithOperator.operator.id,
            leadId,
            type: BalanceTransactionType.LEAD_CANCELLED,
            account: { type: BalanceAccountType.OPERATOR_HOLD },
          },
        });

        if (!alreadyCancelled) {
          await this.applyTransaction({
            userId: orderWithOperator.operator.id,
            accountType: BalanceAccountType.OPERATOR_HOLD,
            amount: operatorAmount,
            transactionType: BalanceTransactionType.LEAD_CANCELLED,
            isCredit: false,
            note: `Lead operator tomonidan bekor qilindi.`,
            metadata: {
              leadId,
              productId: lead.product.id,
            },
            leadId,
            actorId,
          });
        }
      }
    }
  }

  async handleOrderDelivered(orderId: string, actorId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        lead: true,
        product: {
          select: {
            id: true,
            name: true,
            sellerId: true,
            cpaTargetolog: true,
            cpaOperator: true,
            seller: {
              select: {
                id: true,
                salesSharePercent: true,
                role: { select: { slug: true } },
              },
            },
          },
        },
        targetolog: {
          select: {
            id: true,
            role: { select: { slug: true } },
            salesSharePercent: true,
          },
        },
        operator: {
          select: {
            id: true,
            role: { select: { slug: true } },
            salesSharePercent: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }

    if (order.leadId) {
      await this.handleLeadApproved(order.leadId, actorId);
    }

    const productName = order.product.name;

    if (
      order.product.cpaTargetolog &&
      order.leadId &&
      order.targetolog?.id
    ) {
      await this.transferHoldToMain({
        userId: order.targetolog.id,
        amount: new Prisma.Decimal(order.product.cpaTargetolog),
        holdAccountType: BalanceAccountType.TARGETOLOG_HOLD,
        mainAccountType: BalanceAccountType.TARGETOLOG_MAIN,
        leadId: order.leadId,
        productName,
        note: `Lead sotildi: ${productName}`,
        metadata: {
          orderId,
          productId: order.product.id,
          leadId: order.leadId,
        },
        actorId,
      });
    }

    if (
      order.product.cpaOperator &&
      order.operator?.id &&
      order.leadId
    ) {
      await this.transferHoldToMain({
        userId: order.operator.id,
        amount: new Prisma.Decimal(order.product.cpaOperator),
        holdAccountType: BalanceAccountType.OPERATOR_HOLD,
        mainAccountType: BalanceAccountType.OPERATOR_MAIN,
        leadId: order.leadId,
        productName,
        note: `Lead sotildi: ${productName}`,
        metadata: {
          orderId,
          productId: order.product.id,
          leadId: order.leadId,
        },
        actorId,
      });
    }

    if (order.product.seller?.id) {
      const sharePercent = order.product.seller.salesSharePercent ?? new Prisma.Decimal(
        100,
      );
      const shareAmount = new Prisma.Decimal(order.amount).mul(
        new Prisma.Decimal(sharePercent).dividedBy(100),
      );

      if (shareAmount.gt(0)) {
        await this.applyTransaction({
          userId: order.product.seller.id,
          accountType: this.resolveMainAccountType(
            order.product.seller.role?.slug ?? '',
          ),
          amount: shareAmount,
          transactionType: BalanceTransactionType.LEAD_SOLD,
          isCredit: true,
          note: `Sotuv tasdiqlandi: ${productName}`,
          metadata: {
            orderId,
            productId: order.product.id,
            leadId: order.leadId,
            salesSharePercent: sharePercent,
          },
          leadId: order.leadId ?? undefined,
          actorId,
        });
      }
    }
  }

  async handleOrderReturned(orderId: string, actorId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        lead: true,
        product: {
          select: {
            id: true,
            name: true,
            sellerId: true,
            seller: {
              select: {
                id: true,
                role: { select: { slug: true } },
              },
            },
          },
        },
        targetolog: {
          select: {
            id: true,
            role: { select: { slug: true } },
          },
        },
        operator: {
          select: {
            id: true,
            role: { select: { slug: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }

    if (order.leadId && order.targetolog?.id) {
      const saleTx = await this.prisma.balanceTransaction.findFirst({
        where: {
          userId: order.targetolog.id,
          leadId: order.leadId,
          type: BalanceTransactionType.LEAD_SOLD,
          account: { type: BalanceAccountType.TARGETOLOG_MAIN },
        },
      });

      if (saleTx) {
        await this.applyTransaction({
          userId: order.targetolog.id,
          accountType: BalanceAccountType.TARGETOLOG_MAIN,
          amount: saleTx.amount,
          transactionType: BalanceTransactionType.LEAD_CANCELLED,
          isCredit: false,
          note: `Buyurtma qaytarildi: ${order.product.name}`,
          metadata: {
            orderId,
            leadId: order.leadId,
          },
          leadId: order.leadId,
          actorId,
        });
      }
    }

    if (order.leadId && order.operator?.id) {
      const saleTx = await this.prisma.balanceTransaction.findFirst({
        where: {
          userId: order.operator.id,
          leadId: order.leadId,
          type: BalanceTransactionType.LEAD_SOLD,
          account: { type: BalanceAccountType.OPERATOR_MAIN },
        },
      });

      if (saleTx) {
        await this.applyTransaction({
          userId: order.operator.id,
          accountType: BalanceAccountType.OPERATOR_MAIN,
          amount: saleTx.amount,
          transactionType: BalanceTransactionType.LEAD_CANCELLED,
          isCredit: false,
          note: `Buyurtma qaytarildi: ${order.product.name}`,
          metadata: {
            orderId,
            leadId: order.leadId,
          },
          leadId: order.leadId,
          actorId,
        });
      }
    }

    if (order.product.seller?.id && order.leadId) {
      const saleTx = await this.prisma.balanceTransaction.findFirst({
        where: {
          userId: order.product.seller.id,
          leadId: order.leadId,
          type: BalanceTransactionType.LEAD_SOLD,
          account: {
            type: this.resolveMainAccountType(
              order.product.seller.role?.slug ?? '',
            ),
          },
        },
      });

      if (saleTx) {
        await this.applyTransaction({
          userId: order.product.seller.id,
          accountType: this.resolveMainAccountType(
            order.product.seller.role?.slug ?? '',
          ),
          amount: saleTx.amount,
          transactionType: BalanceTransactionType.LEAD_CANCELLED,
          isCredit: false,
          note: `Buyurtma qaytarildi: ${order.product.name}`,
          metadata: {
            orderId,
            leadId: order.leadId,
          },
          leadId: order.leadId,
          actorId,
        });
      }
    }
  }

  async requestPayout(
    userId: string,
    amount: Prisma.Decimal | number | string,
    cardPayload: { cardNumber: string; cardHolder: string },
    actorId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const amountDecimal = new Prisma.Decimal(amount);
    if (amountDecimal.lte(0)) {
      throw new BadRequestException('Summani musbat kiriting.');
    }

    await this.enforcePayoutLimits(userId, amountDecimal, tx);

    const mainAccountType = await this.resolveMainAccountTypeForUser(
      userId,
      tx,
    );

    const result = await this.applyTransaction({
      userId,
      accountType: mainAccountType,
      amount: amountDecimal,
      transactionType: BalanceTransactionType.PAYOUT_REQUEST,
      isCredit: false,
      note: 'To‘lov so‘rovi yuborildi.',
      metadata: {
        cardNumber: cardPayload.cardNumber,
        cardHolder: cardPayload.cardHolder,
      },
      actorId,
      tx,
    });

    await this.detectCardReuseFraud(
      {
        userId,
        transactionId: result.transaction.id,
        cardNumber: cardPayload.cardNumber,
      },
    );

    if (tx) {
      setTimeout(() => this.emitBalanceStream(userId), 0);
    }

    return result.transaction;
  }

  async handlePayoutApproval(
    payout: PayoutNotificationPayload,
    actorId?: string,
  ) {
    const userId = payout.userId;
    const amountDecimal = new Prisma.Decimal(payout.amount);
    const displayName = this.resolvePayoutDisplayName(
      payout.user,
      payout.userId,
    );
    const formattedAmount = this.formatAmount(amountDecimal, true).replace(
      '+ ',
      '',
    );
    const maskedCard = this.maskCardNumber(payout.cardNumber);

    await this.activityService.log({
      userId: actorId ?? userId,
      action: 'To‘lov so‘rovi tasdiqlandi.',
      meta: {
        payoutId: payout.id,
        targetUserId: userId,
      },
    });

    await this.notificationsService.create({
      toUserId: userId,
      message: `To‘lovingiz tasdiqlandi. Summa: ${formattedAmount}.`,
      type: NotificationType.PAYOUT,
      metadata: {
        payoutId: payout.id,
        status: 'APPROVED',
        cardNumber: maskedCard,
      },
    });

    await this.notificationsService.sendTelegramMessage(
      `✅ Payout tasdiqlandi\n• Foydalanuvchi: ${displayName}\n• Miqdor: ${formattedAmount}\n• Karta: ${maskedCard}\n• Payout ID: ${payout.id}`,
    );
  }

  async handlePayoutRejection(
    payout: PayoutNotificationPayload,
    actorId?: string,
  ) {
    const userId = payout.userId;
    const amountDecimal = new Prisma.Decimal(payout.amount);

    const mainAccountType = await this.resolveMainAccountTypeForUser(userId);

    await this.applyTransaction({
      userId,
      accountType: mainAccountType,
      amount: amountDecimal,
      transactionType: BalanceTransactionType.PAYOUT_REJECTED,
      isCredit: true,
      note: 'To‘lov so‘rovi rad etildi, mablag‘ qaytarildi.',
      metadata: {
        payoutId: payout.id,
      },
      actorId,
    });

    const displayName = this.resolvePayoutDisplayName(
      payout.user,
      payout.userId,
    );
    const formattedAmount = this.formatAmount(amountDecimal, true).replace(
      '+ ',
      '',
    );
    const maskedCard = this.maskCardNumber(payout.cardNumber);

    await this.notificationsService.create({
      toUserId: userId,
      message: 'To‘lov so‘rovi rad etildi. Mablag‘ingiz balansga qaytarildi.',
      type: NotificationType.PAYOUT,
      metadata: {
        payoutId: payout.id,
        status: 'REJECTED',
        cardNumber: maskedCard,
      },
    });

    await this.notificationsService.sendTelegramMessage(
      `⚠️ Payout rad etildi\n• Foydalanuvchi: ${displayName}\n• Miqdor: ${formattedAmount}\n• Karta: ${maskedCard}\n• Payout ID: ${payout.id}`,
    );
  }

  async getFraudChecks(status?: FraudCheckStatus) {
    const checks = await this.prisma.balanceFraudCheck.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        transaction: {
          select: {
            id: true,
            type: true,
            amount: true,
            createdAt: true,
            account: {
              select: {
                type: true,
              },
            },
          },
        },
      },
    });

    return checks.map((check) => ({
      id: check.id,
      status: check.status,
      reason: check.reason,
      createdAt: check.createdAt,
      resolvedAt: check.resolvedAt,
      resolutionNote: check.resolutionNote,
      transaction: check.transaction
        ? {
            id: check.transaction.id,
            type: check.transaction.type,
            amount: new Prisma.Decimal(
              check.transaction.amount ?? 0,
            ).toFixed(2),
            accountType: check.transaction.account?.type,
            createdAt: check.transaction.createdAt,
          }
        : null,
    }));
  }

  async resolveFraudCheck(
    id: string,
    dto: ResolveFraudDto,
    actorId: string,
  ) {
    const check = await this.prisma.balanceFraudCheck.findUnique({
      where: { id },
    });
    if (!check) {
      throw new NotFoundException('Fraud tekshiruvi topilmadi.');
    }

    const resolvedAt =
      dto.status === FraudCheckStatus.RESOLVED ||
      dto.status === FraudCheckStatus.REVOKED
        ? new Date()
        : null;

    const updated = await this.prisma.balanceFraudCheck.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNote: dto.resolutionNote,
        resolvedAt,
      },
    });

    await this.activityService.log({
      userId: actorId,
      action: 'Fraud tekshiruvi holati yangilandi.',
      meta: {
        checkId: updated.id,
        status: updated.status,
      },
    });

    return {
      message: 'Fraud tekshiruvi yangilandi.',
      check: updated,
    };
  }

  private async applyTransaction(params: ApplyTransactionParams) {
    const amountDecimal = new Prisma.Decimal(params.amount);
    if (amountDecimal.lte(0)) {
      throw new BadRequestException('Summani musbat qiymatda kiriting.');
    }

    const result = params.tx
      ? await this.applyTransactionInternal(params.tx, {
          ...params,
          amount: amountDecimal,
        })
      : await this.prisma.$transaction((tx) =>
          this.applyTransactionInternal(tx, {
            ...params,
            amount: amountDecimal,
          }),
        );

    if (!params.tx) {
      await this.activityService.log({
        userId: params.actorId ?? params.userId,
        action: this.buildActivityMessage(params, amountDecimal),
        meta: {
          targetUserId: params.userId,
          accountType: params.accountType,
          transactionType: params.transactionType,
          isCredit: params.isCredit,
          amount: amountDecimal.toString(),
          leadId: params.leadId,
          payoutId: params.payoutId,
        },
      });

      if (params.actorId && params.actorId !== params.userId) {
        await this.notificationsService.create({
          toUserId: params.userId,
          message: `Balansingiz yangilandi: ${this.formatAmount(
            amountDecimal,
            params.isCredit,
          )}`,
          type: NotificationType.USER,
          metadata: {
            transactionType: params.transactionType,
            accountType: params.accountType,
          },
        });
      }

      this.emitBalanceStream(params.userId);
    }

    return result;
  }

  private async applyTransactionInternal(
    tx: Prisma.TransactionClient,
    params: ApplyTransactionParams & { amount: Prisma.Decimal },
  ) {
    const user =
      params.user ??
      (await tx.user.findUnique({
        where: { id: params.userId },
        select: {
          id: true,
          firstName: true,
          nickname: true,
          salesSharePercent: true,
          role: {
            select: {
              slug: true,
            },
          },
        },
      }));

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
    }

    await this.ensureAccountsForRole(tx, user.id, user.role?.slug ?? '');

    const account = await tx.balanceAccount.findUnique({
      where: {
        userId_type: {
          userId: params.userId,
          type: params.accountType,
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Balans hisobi topilmadi.');
    }

    const before = new Prisma.Decimal(account.amount ?? 0);
    const delta = params.isCredit
      ? params.amount
      : params.amount.negated();
    const after = before.plus(delta);
    if (after.lt(0)) {
      throw new BadRequestException('Balansda mablag‘ yetarli emas.');
    }

    await tx.balanceAccount.update({
      where: { id: account.id },
      data: {
        amount: after,
      },
    });

    const transaction = await tx.balanceTransaction.create({
      data: {
        accountId: account.id,
        userId: params.userId,
        type: params.transactionType,
        amount: params.amount,
        balanceBefore: before,
        balanceAfter: after,
        isCredit: params.isCredit,
        note: params.note,
        metadata: params.metadata,
        leadId: params.leadId,
        payoutId: params.payoutId,
      },
    });

    return {
      user,
      transaction,
      accountType: params.accountType,
    };
  }

  private async transferHoldToMain(params: TransferHoldParams) {
    const amountDecimal = new Prisma.Decimal(params.amount);
    if (amountDecimal.lte(0)) {
      return;
    }

    const existing = await this.prisma.balanceTransaction.findFirst({
      where: {
        userId: params.userId,
        leadId: params.leadId,
        type: BalanceTransactionType.LEAD_SOLD,
        account: { type: params.mainAccountType },
      },
    });

    if (existing) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: params.userId },
        select: {
          id: true,
          firstName: true,
          nickname: true,
          salesSharePercent: true,
          role: {
            select: {
              slug: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('Foydalanuvchi topilmadi.');
      }

      const holdTx = await this.applyTransactionInternal(tx, {
        user,
        userId: params.userId,
        accountType: params.holdAccountType,
        amount: amountDecimal,
        transactionType: BalanceTransactionType.LEAD_SOLD,
        isCredit: false,
        note: params.note,
        metadata: params.metadata,
        leadId: params.leadId,
      });

      const mainTx = await this.applyTransactionInternal(tx, {
        user,
        userId: params.userId,
        accountType: params.mainAccountType,
        amount: amountDecimal,
        transactionType: BalanceTransactionType.LEAD_SOLD,
        isCredit: true,
        note: params.note,
        metadata: params.metadata,
        leadId: params.leadId,
      });

    });

    await this.activityService.log({
      userId: params.actorId ?? params.userId,
      action: `Lead sotildi va balans yangilandi.`,
      meta: {
        leadId: params.leadId,
        productName: params.productName,
        amount: amountDecimal.toString(),
      },
    });
    this.emitBalanceStream(params.userId);
  }

  subscribeToBalance(userId: string): Observable<BalanceStreamEvent> {
    let stream = this.balanceStreams.get(userId);
    if (!stream) {
      stream = new Subject<BalanceStreamEvent>();
      this.balanceStreams.set(userId, stream);
      setTimeout(() => stream?.next({ type: 'BALANCE_UPDATED' }), 0);
    }
    return stream.asObservable();
  }

  private emitBalanceStream(userId: string) {
    const stream = this.balanceStreams.get(userId);
    stream?.next({ type: 'BALANCE_UPDATED' });
  }

  private getPayoutLimits(): PayoutLimitsConfig {
    const raw = this.configService.get<PayoutLimitsConfig>('app.payoutLimits');
    return {
      minAmount: this.normalizeLimit(raw?.minAmount),
      dailyAmountLimit: this.normalizeLimit(raw?.dailyAmountLimit),
      monthlyAmountLimit: this.normalizeLimit(raw?.monthlyAmountLimit),
      dailyRequestLimit: this.normalizeLimit(raw?.dailyRequestLimit),
    };
  }

  private normalizeLimit(value?: number): number {
    if (!value || Number.isNaN(value) || value <= 0) {
      return 0;
    }
    return value;
  }

  private async enforcePayoutLimits(
    userId: string,
    amount: Prisma.Decimal,
    tx?: Prisma.TransactionClient,
  ) {
    const limits = this.getPayoutLimits();
    const client = tx ?? this.prisma;

    if (limits.minAmount > 0) {
      const minAmountDecimal = new Prisma.Decimal(limits.minAmount);
      if (amount.lt(minAmountDecimal)) {
        throw new BadRequestException(
          `Minimal payout summasi ${this.formatAmount(
            minAmountDecimal,
            true,
          ).replace('+ ', '')}.`,
        );
      }
    }

    const statuses = this.payoutStatusesForLimits;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (limits.dailyAmountLimit > 0) {
      const aggregate = await client.payout.aggregate({
        where: {
          userId,
          status: { in: statuses },
          createdAt: { gte: startOfDay },
        },
        _sum: { amount: true },
      });
      const projected = new Prisma.Decimal(aggregate._sum.amount ?? 0).plus(
        amount,
      );
      if (projected.gt(limits.dailyAmountLimit)) {
        throw new BadRequestException(
          `Kunlik yechib olish limiti ${this.formatAmount(
            new Prisma.Decimal(limits.dailyAmountLimit),
            true,
          ).replace('+ ', '')} ga yetdi.`,
        );
      }
    }

    if (limits.monthlyAmountLimit > 0) {
      const aggregate = await client.payout.aggregate({
        where: {
          userId,
          status: { in: statuses },
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      });
      const projected = new Prisma.Decimal(aggregate._sum.amount ?? 0).plus(
        amount,
      );
      if (projected.gt(limits.monthlyAmountLimit)) {
        throw new BadRequestException(
          `Oylik yechib olish limiti ${this.formatAmount(
            new Prisma.Decimal(limits.monthlyAmountLimit),
            true,
          ).replace('+ ', '')} dan oshib ketdi.`,
        );
      }
    }

    if (limits.dailyRequestLimit > 0) {
      const count = await client.payout.count({
        where: {
          userId,
          status: { in: statuses },
          createdAt: { gte: startOfDay },
        },
      });
      if (count + 1 > limits.dailyRequestLimit) {
        throw new BadRequestException(
          `Kunlik payout so‘rovlar chegarasi (${limits.dailyRequestLimit} ta) oshib ketdi.`,
        );
      }
    }
  }

  private async ensureAccountsForRole(
    tx: Prisma.TransactionClient,
    userId: string,
    roleSlug: string,
  ) {
    const accountTypes =
      this.ROLE_ACCOUNT_MAP[roleSlug?.toUpperCase()] ??
      [BalanceAccountType.GENERIC_MAIN];

    await Promise.all(
      accountTypes.map((type) =>
        tx.balanceAccount.upsert({
          where: {
            userId_type: {
              userId,
              type,
            },
          },
          update: {},
          create: {
            userId,
            type,
          },
        }),
      ),
    );
  }

  private async resolveMainAccountTypeForUser(
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
    }

    return this.resolveMainAccountType(user.role?.slug ?? '');
  }

  private resolveMainAccountType(roleSlug: string) {
    return (
      this.ROLE_MAIN_ACCOUNT[roleSlug?.toUpperCase()] ??
      BalanceAccountType.GENERIC_MAIN
    );
  }

  private maskCardNumber(cardNumber?: string | null) {
    if (!cardNumber) {
      return '—';
    }
    return cardNumber.replace(/.(?=.{4})/g, '•');
  }

  private resolvePayoutDisplayName(
    user?: PayoutUserSummary,
    fallback?: string,
  ) {
    return user?.nickname ?? user?.firstName ?? fallback ?? 'Noma’lum foydalanuvchi';
  }

  private formatAmount(amount: Prisma.Decimal, isCredit: boolean) {
    const numeric = Number(amount.toFixed(2));

    const formatted = new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
    }).format(numeric);

    return isCredit ? `+ ${formatted}` : `- ${formatted}`;
  }

  private buildActivityMessage(
    params: ApplyTransactionParams,
    amount: Prisma.Decimal,
  ) {
    const direction = params.isCredit ? 'kiritildi' : 'yechildi';
    return `Balansdan ${amount.toFixed(2)} so‘m ${direction}.`;
  }

  private serializeTransaction(transaction: BalanceTransaction) {
    return {
      id: transaction.id,
      type: transaction.type,
      amount: new Prisma.Decimal(transaction.amount ?? 0).toFixed(2),
      balanceBefore: new Prisma.Decimal(
        transaction.balanceBefore ?? 0,
      ).toFixed(2),
      balanceAfter: new Prisma.Decimal(
        transaction.balanceAfter ?? 0,
      ).toFixed(2),
      isCredit: transaction.isCredit,
      createdAt: transaction.createdAt,
      leadId: transaction.leadId,
      payoutId: transaction.payoutId,
      note: transaction.note,
      metadata: transaction.metadata,
    };
  }

  private async openFraudCheck(payload: {
    userId: string;
    transactionId?: string | null;
    reason: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const existing = await this.prisma.balanceFraudCheck.findFirst({
      where: {
        userId: payload.userId,
        ...(payload.transactionId
          ? { transactionId: payload.transactionId }
          : { reason: payload.reason }),
        status: {
          in: [FraudCheckStatus.OPEN, FraudCheckStatus.REVIEWING],
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.balanceFraudCheck.create({
      data: {
        userId: payload.userId,
        transactionId: payload.transactionId ?? null,
        reason: payload.reason,
        metadata: payload.metadata ?? Prisma.JsonNull,
      },
    });
  }
}
