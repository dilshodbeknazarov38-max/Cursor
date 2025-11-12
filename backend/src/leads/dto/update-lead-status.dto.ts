import { IsEnum } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus, {
    message:
      'Yaroqsiz lead statusi. YANGI | TASDIQLANGAN | RAD_ETILGAN | QAYTA_ALOQA dan birini tanlang.',
  })
  status!: LeadStatus;
}
