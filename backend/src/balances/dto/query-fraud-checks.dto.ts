import { IsEnum, IsOptional } from 'class-validator';
import { FraudCheckStatus } from '@prisma/client';

export class QueryFraudChecksDto {
  @IsOptional()
  @IsEnum(FraudCheckStatus, {
    message: 'Fraud status noto‘g‘ri ko‘rsatildi.',
  })
  status?: FraudCheckStatus;
}
