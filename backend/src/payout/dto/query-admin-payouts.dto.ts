import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PayoutStatus } from '@prisma/client';

export class QueryAdminPayoutsDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsEnum(PayoutStatus, {
    message: 'Status noto‘g‘ri. PENDING | APPROVED | REJECTED dan birini kiriting.',
  })
  status?: PayoutStatus;

  @IsOptional()
  @Type(() => Date)
  dateFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  dateTo?: Date;
}
