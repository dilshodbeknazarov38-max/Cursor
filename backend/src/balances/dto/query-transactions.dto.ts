import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';
import { BalanceAccountType } from '@prisma/client';

export class QueryTransactionsDto {
  @IsOptional()
  @IsEnum(BalanceAccountType, {
    message: 'Balans turi noto‘g‘ri ko‘rsatildi.',
  })
  accountType?: BalanceAccountType;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'Limit butun son bo‘lishi kerak.' })
  @IsPositive({ message: 'Limit 0 dan katta bo‘lishi kerak.' })
  @Min(1, { message: 'Limit kamida 1 bo‘lishi kerak.' })
  @Max(200, { message: 'Limit ko‘pi bilan 200 bo‘lishi mumkin.' })
  limit?: number;
}
