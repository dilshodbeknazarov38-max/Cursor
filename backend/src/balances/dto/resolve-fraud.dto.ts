import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { FraudCheckStatus } from '@prisma/client';

export class ResolveFraudDto {
  @IsEnum(FraudCheckStatus, {
    message: 'Fraud status noto‘g‘ri ko‘rsatildi.',
  })
  status!: FraudCheckStatus;

  @IsOptional()
  @IsString({ message: 'Izoh matn ko‘rinishida bo‘lishi kerak.' })
  @MaxLength(500, { message: 'Izoh 500 belgidan oshmasligi kerak.' })
  resolutionNote?: string;
}
