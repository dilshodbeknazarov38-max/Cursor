import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePayoutDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'To‘lov summasi noto‘g‘ri formatda.' },
  )
  @IsPositive({ message: 'To‘lov summasi musbat bo‘lishi kerak.' })
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Izoh 300 belgidan oshmasligi kerak.' })
  comment?: string;
}
