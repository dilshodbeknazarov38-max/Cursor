import { IsOptional, IsString } from 'class-validator';

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
  @IsString()
  roleSlug?: string;
}
