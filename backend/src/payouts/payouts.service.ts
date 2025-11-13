import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, PayoutStatus, Prisma } from '@prisma/client';

import { ActivityService } from '@/activity/activity.service';
import { BalancesService } from '@/balances/balances.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { PrismaService } from '@/prisma/prisma.service';

import { CreatePayoutDto } from './dto/create-payout.dto';
import { UpdatePayoutStatusDto } from './dto/update-payout-status.dto';

type AuthContext = {
  userId: string;
  role: string;
};

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
    private readonly balancesService: BalancesService,
  ) {}

  async requestPayout(dto: CreatePayoutDto, context: AuthContext) {
    const payout = await this.prisma.$transaction(async (tx) => {
      await this.balancesService.requestPayout(
        context.userId,
        new Prisma.Decimal(dto.amount),
        {
          cardNumber: dto.cardNumber,
          cardHolder: dto.cardHolder,
        },
        context.userId,
        tx,
      );

      return tx.payout.create({
        data: {
          userId: context.userId,
          amount: new Prisma.Decimal(dto.amount),
          comment: dto.comment,
          cardNumber: dto.cardNumber,
          cardHolder: dto.cardHolder,
        },
      });
    });

    await this.activityService.log({
      userId: context.userId,
      action: 'Yangi to‘lov so‘rovi yuborildi.',
      meta: {
        payoutId: payout.id,
        amount: payout.amount,
      },
    });

    await this.notifyAdmins(
      `Yangi to‘lov so‘rovi: ${payout.amount.toString()} so‘m`,
      payout.id,
    );

    return {
      message: 'To‘lov so‘rovi yuborildi. Admin tasdiqlashini kuting.',
      payout,
    };
  }

  async list(
    context: AuthContext,
    filter?: { status?: PayoutStatus },
  ) {
    const where: Prisma.PayoutWhereInput = {};
    if (!['ADMIN', 'SUPER_ADMIN'].includes(context.role)) {
      where.userId = context.userId;
    }
    if (filter?.status) {
      where.status = filter.status;
    }

    return this.prisma.payout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdatePayoutStatusDto,
    context: AuthContext,
  ) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(context.role)) {
      throw new ForbiddenException('To‘lov statusini o‘zgartirishga ruxsat yo‘q.');
    }

    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            nickname: true,
            phone: true,
          },
        },
      },
    });
    if (!payout) {
      throw new NotFoundException('To‘lov so‘rovi topilmadi.');
    }

    const updated = await this.prisma.payout.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        user: {
          select: {
            firstName: true,
            nickname: true,
            phone: true,
          },
        },
      },
    });

    await this.activityService.log({
      userId: context.userId,
      action: `To‘lov statusi yangilandi: ${dto.status}`,
      meta: {
        payoutId: updated.id,
        status: dto.status,
      },
    });

    if (dto.status === PayoutStatus.APPROVED) {
      await this.balancesService.handlePayoutApproval(
        {
          id: updated.id,
          userId: updated.userId,
          amount: updated.amount,
          cardNumber: updated.cardNumber ?? undefined,
          cardHolder: updated.cardHolder ?? undefined,
          user: payout.user,
        },
        context.userId,
      );
    } else if (dto.status === PayoutStatus.REJECTED) {
      await this.balancesService.handlePayoutRejection(
        {
          id: updated.id,
          userId: updated.userId,
          amount: updated.amount,
          cardNumber: updated.cardNumber ?? undefined,
          cardHolder: updated.cardHolder ?? undefined,
          user: payout.user,
        },
        context.userId,
      );
    } else {
      await this.notificationsService.create({
        toUserId: updated.userId,
        message: `To‘lov so‘rovingiz holati: ${dto.status}`,
        type: NotificationType.PAYOUT,
        metadata: {
          payoutId: updated.id,
        },
      });
    }

    return {
      message: 'To‘lov statusi yangilandi.',
      payout: updated,
    };
  }

  private async notifyAdmins(message: string, payoutId: string) {
    const admins = await this.prisma.user.findMany({
      where: {
        role: {
          slug: { in: ['ADMIN', 'SUPER_ADMIN'] },
        },
      },
      select: { id: true },
    });

    if (admins.length === 0) {
      return;
    }

    await this.notificationsService.notifyMany(
      admins.map((admin) => admin.id),
      message,
      NotificationType.PAYOUT,
      { payoutId },
    );
  }
}
