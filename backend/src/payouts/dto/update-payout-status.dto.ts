import { IsEnum } from 'class-validator';
import { PayoutStatus } from '@prisma/client';

export class UpdatePayoutStatusDto {
  @IsEnum(PayoutStatus, {
    message:
      'Yaroqsiz to‘lov statusi. PENDING | APPROVED | REJECTED | PAID | CANCELLED.',
  })
  status!: PayoutStatus;
}
