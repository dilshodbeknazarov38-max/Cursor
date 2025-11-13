import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { BalanceAccountType } from '@prisma/client';

export class AdjustBalanceDto {
  @IsUUID('4', { message: 'Foydalanuvchi identifikatori noto‘g‘ri.' })
  userId!: string;

  @IsEnum(BalanceAccountType, {
    message: 'Balans turi noto‘g‘ri ko‘rsatildi.',
  })
  accountType!: BalanceAccountType;

  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'Summani raqam ko‘rinishida kiriting.' },
  )
  @IsPositive({ message: 'Summani musbat qiymatda kiriting.' })
  amount!: number;

  @IsIn(['INCREASE', 'DECREASE'], {
    message: 'Amal turi noto‘g‘ri ko‘rsatildi.',
  })
  operation!: 'INCREASE' | 'DECREASE';

  @IsString({ message: 'Sabab matn ko‘rinishida bo‘lishi kerak.' })
  @MaxLength(180, {
    message: 'Sabab matni 180 belgidan oshmasligi kerak.',
  })
  reason!: string;

  @IsOptional()
  @IsString({ message: 'Izoh matn ko‘rinishida bo‘lishi kerak.' })
  @MaxLength(500, {
    message: 'Izoh 500 belgidan oshmasligi kerak.',
  })
  note?: string;
}
