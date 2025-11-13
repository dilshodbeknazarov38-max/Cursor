import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BalanceAccountType,
  BalanceTransaction,
  BalanceTransactionType,
  FraudCheckStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';

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

@Injectable()
export class BalancesService {
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

    const mainAccountType = await this.resolveMainAccountTypeForUser(userId, tx);

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

    return result.transaction;
  }

  async handlePayoutApproval(
    payoutId: string,
    userId: string,
    actorId?: string,
  ) {
    await this.activityService.log({
      userId: actorId ?? userId,
      action: 'To‘lov so‘rovi tasdiqlandi.',
      meta: {
        payoutId,
        targetUserId: userId,
      },
    });

    await this.notificationsService.create({
      toUserId: userId,
      message: 'To‘lovingiz tasdiqlandi va qayta ishlanmoqda.',
      type: NotificationType.PAYOUT,
      metadata: {
        payoutId,
        status: 'APPROVED',
      },
    });
  }

  async handlePayoutRejection(
    payoutId: string,
    userId: string,
    amount: Prisma.Decimal | string | number,
    actorId?: string,
  ) {
    const mainAccountType = await this.resolveMainAccountTypeForUser(userId);
    const amountDecimal = new Prisma.Decimal(amount);

    await this.applyTransaction({
      userId,
      accountType: mainAccountType,
      amount: amountDecimal,
      transactionType: BalanceTransactionType.PAYOUT_REJECTED,
      isCredit: true,
      note: 'To‘lov so‘rovi rad etildi, mablag‘ qaytarildi.',
      metadata: {
        payoutId,
      },
      actorId,
    });

    await this.notificationsService.create({
      toUserId: userId,
      message: 'To‘lov so‘rovi rad etildi. Mablag‘ingiz balansga qaytarildi.',
      type: NotificationType.PAYOUT,
      metadata: {
        payoutId,
        status: 'REJECTED',
      },
    });
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
    transactionId: string;
    reason: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const existing = await this.prisma.balanceFraudCheck.findFirst({
      where: {
        transactionId: payload.transactionId,
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
        transactionId: payload.transactionId,
        reason: payload.reason,
        metadata: payload.metadata,
      },
    });
  }
}
