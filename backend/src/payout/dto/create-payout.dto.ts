import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePayoutDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Minimal yechib olish summasi 0.01 dan kam bo‘lishi mumkin emas.' })
  amount!: number;

  @IsString()
  @Length(8, 32, { message: 'Karta raqami 8-32 belgi oralig‘ida bo‘lishi kerak.' })
  cardNumber!: string;

  @IsString()
  @Length(3, 64, { message: 'Karta egasi ismi 3-64 belgi oralig‘ida bo‘lishi kerak.' })
  cardHolder!: string;

  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'Izoh 250 belgidan oshmasligi kerak.' })
  comment?: string;
}
