import { UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstName!: string;

  @IsString()
  nickname!: string;

  @IsString()
  phone!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
