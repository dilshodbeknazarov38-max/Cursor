import { IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
