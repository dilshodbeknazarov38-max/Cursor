import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserBlockDto {
  @IsBoolean()
  block!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'Sabab 250 belgidan oshmasligi kerak.' })
  reason?: string;
}
