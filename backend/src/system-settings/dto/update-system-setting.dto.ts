import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateSystemSettingDto {
  @IsString()
  @IsNotEmpty({ message: 'Qiymat kiritilishi kerak.' })
  @MaxLength(500, { message: 'Qiymat 500 belgidan oshmasligi kerak.' })
  value!: string;
}
