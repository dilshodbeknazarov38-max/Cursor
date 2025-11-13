import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryMovementType,
  Prisma,
  ProductStatus,
} from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

import { TelegramService } from '@/notifications/telegram.service';

type InventoryContext = {
  userId: string;
  role: string;
};

@Injectable()
export class WarehouseService {
  private readonly LOW_STOCK_THRESHOLD = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async getInventory() {
    const products = await this.prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        stock: true,
        reservedStock: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            nickname: true,
          },
        },
      },
    });

    return products.map((product) => {
      const ownerName = product.owner
        ? `${product.owner.firstName ?? product.owner.nickname} (${product.owner.nickname})`
        : null;

      return {
        ...product,
        owner: product.owner
          ? {
              id: product.owner.id,
              name: ownerName,
            }
          : null,
        available: product.stock,
        reserved: product.reservedStock,
      };
    });
  }

  async adjustStock(
    dto: { productId: string; quantity: number; type: 'increase' | 'decrease'; reason?: string },
    context: InventoryContext,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const product = await client.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, ownerId: true, stock: true, status: true, title: true },
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }

    const isSupplier = context.role === 'TAMINOTCHI';
    const isWarehouseAdmin = ['SKLAD_ADMIN', 'SUPER_ADMIN'].includes(context.role);

    if (isSupplier) {
      if (product.ownerId !== context.userId) {
        throw new ForbiddenException('Boshqa mahsulot zaxirasini o‘zgartira olmaysiz.');
      }
      if (product.status === ProductStatus.REJECTED) {
        throw new BadRequestException('Rad etilgan mahsulot zaxirasini o‘zgartirib bo‘lmaydi.');
      }
    } else if (!isWarehouseAdmin) {
      throw new ForbiddenException('Zaxirani boshqarish uchun ruxsat yo‘q.');
    }

    const delta = dto.type === 'increase' ? dto.quantity : -dto.quantity;
    const nextStock = product.stock + delta;

    if (nextStock < 0) {
      throw new BadRequestException('Omborda yetarli zaxira mavjud emas.');
    }

    const updated = await client.product.update({
      where: { id: product.id },
      data: {
        stock: nextStock,
      },
      select: {
        id: true,
        title: true,
        stock: true,
        reservedStock: true,
        status: true,
      },
    });

    await client.inventoryMovement.create({
      data: {
        productId: product.id,
        orderId: null,
        userId: context.userId,
        type: dto.type === 'increase' ? InventoryMovementType.INCREASE : InventoryMovementType.DECREASE,
        quantity: dto.quantity,
        reason: dto.reason,
      },
    });

    await this.notifyLowStock(updated.id, updated.title, updated.stock);

    return updated;
  }

  async reserveProduct(
    productId: string,
    quantity: number,
    orderId: string,
    userId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Miqdor musbat bo‘lishi kerak.');
    }
    const client = tx ?? this.prisma;
    const product = await client.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true, stock: true, reservedStock: true },
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Omborda yetarli zaxira yo‘q.');
    }

    const updated = await client.product.update({
      where: { id: product.id },
      data: {
        stock: product.stock - quantity,
        reservedStock: product.reservedStock + quantity,
      },
      select: {
        id: true,
        title: true,
        stock: true,
        reservedStock: true,
      },
    });

    await client.inventoryMovement.create({
      data: {
        productId: product.id,
        orderId,
        userId,
        type: InventoryMovementType.RESERVE,
        quantity,
        reason: 'Buyurtma qadoqlash',
      },
    });

    await this.notifyLowStock(updated.id, updated.title, updated.stock);
  }

  async releaseReservation(
    productId: string,
    quantity: number,
    orderId: string,
    userId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Miqdor musbat bo‘lishi kerak.');
    }
    const client = tx ?? this.prisma;
    const product = await client.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true, reservedStock: true },
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }

    if (product.reservedStock < quantity) {
      throw new BadRequestException('Rezervda yetarli mahsulot mavjud emas.');
    }

    await client.product.update({
      where: { id: productId },
      data: {
        stock: product.stock + quantity,
        reservedStock: product.reservedStock - quantity,
      },
    });

    await client.inventoryMovement.create({
      data: {
        productId,
        orderId,
        userId,
        type: InventoryMovementType.RELEASE,
        quantity,
        reason: 'Buyurtma qaytarildi',
      },
    });
  }

  async commitReservation(
    productId: string,
    quantity: number,
    orderId: string,
    userId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Miqdor musbat bo‘lishi kerak.');
    }
    const client = tx ?? this.prisma;
    const product = await client.product.findUnique({
      where: { id: productId },
      select: { id: true, reservedStock: true },
    });

    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi.');
    }

    if (product.reservedStock < quantity) {
      throw new BadRequestException('Rezervda yetarli mahsulot mavjud emas.');
    }

    await client.product.update({
      where: { id: productId },
      data: {
        reservedStock: product.reservedStock - quantity,
      },
    });

    await client.inventoryMovement.create({
      data: {
        productId,
        orderId,
        userId,
        type: InventoryMovementType.COMMIT,
        quantity,
        reason: 'Buyurtma yetkazildi',
      },
    });
  }

  private async notifyLowStock(productId: string, title: string, stock: number) {
    if (stock > this.LOW_STOCK_THRESHOLD) {
      return;
    }
    const message = `⚠️ *Kam zaxira ogohlantirishi*\nMahsulot: *${title}*\nZaxira: *${stock}* dona qoldi. (ID: ${productId})`;
    await this.telegramService.sendMessage(message);
  }
}
