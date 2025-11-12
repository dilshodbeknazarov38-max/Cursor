import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

type CreateNotificationPayload = {
  toUserId: string;
  message: string;
  type?: NotificationType;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CreateNotificationPayload) {
    return this.prisma.notification.create({
      data: {
        toUserId: payload.toUserId,
        message: payload.message,
        type: payload.type ?? NotificationType.SYSTEM,
        metadata: payload.metadata ?? Prisma.JsonNull,
      },
    });
  }

  async notifyMany(
    userIds: string[],
    message: string,
    type: NotificationType = NotificationType.SYSTEM,
    metadata?: Prisma.InputJsonValue,
  ) {
    if (userIds.length === 0) {
      return { count: 0 };
    }

    await this.prisma.notification.createMany({
      data: userIds.map((id) => ({
        toUserId: id,
        message,
        type,
        metadata: metadata ?? Prisma.JsonNull,
      })),
    });

    return { count: userIds.length };
  }

  async listForUser(
    userId: string,
    options?: { onlyUnseen?: boolean; limit?: number },
  ) {
    const limit = options?.limit
      ? Math.min(Math.max(options.limit, 1), 100)
      : 50;
    return this.prisma.notification.findMany({
      where: {
        toUserId: userId,
        ...(options?.onlyUnseen ? { seen: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsSeen(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, toUserId: userId },
    });
    if (!notification) {
      throw new NotFoundException('Bildirishnoma topilmadi.');
    }
    if (notification.seen) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id },
      data: { seen: true },
    });
  }

  async markAllAsSeen(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { toUserId: userId, seen: false },
      data: { seen: true },
    });
    return {
      message: 'Barcha bildirishnomalar ko‘rilgan deb belgilandi.',
      updated: count,
    };
  }
}
