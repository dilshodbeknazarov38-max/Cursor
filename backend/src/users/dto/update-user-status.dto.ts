import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus, {
    message: 'Status noto‘g‘ri. ACTIVE | BLOCKED | INACTIVE dan birini tanlang.',
  })
  status!: UserStatus;

  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'Sabab 250 belgidan oshmasligi kerak.' })
  reason?: string;
}
