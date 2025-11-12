import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message:
      'Yaroqsiz buyurtma statusi. NEW | ASSIGNED | IN_DELIVERY | DELIVERED | RETURNED | ARCHIVED dan birini tanlang.',
  })
  status!: OrderStatus;
}
