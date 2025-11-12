import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

type ActivityLogPayload = {
  userId: string;
  action: string;
  ip?: string | null;
  device?: string | null;
  meta?: Prisma.InputJsonValue;
};

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(payload: ActivityLogPayload) {
    try {
      return await this.prisma.activityLog.create({
        data: {
          userId: payload.userId,
          action: payload.action,
          ip: payload.ip ?? null,
          device: payload.device ?? null,
          meta: payload.meta ?? Prisma.JsonNull,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Faollik jurnali yozib olinmasa ham, asosiy jarayon to‘xtamasligi kerak.
        return null;
      }
      throw error;
    }
  }

  async listRecent(take = 50) {
    const limit = this.normalizeTake(take);
    return this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            nickname: true,
            phone: true,
            role: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async listForUser(userId: string, take = 50) {
    const limit = this.normalizeTake(take);
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private normalizeTake(take: number) {
    if (!take || Number.isNaN(Number(take))) {
      return 50;
    }
    return Math.min(Math.max(Number(take), 1), 200);
  }
}
