import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePayoutDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'To‘lov summasi noto‘g‘ri formatda.' },
  )
  @IsPositive({ message: 'To‘lov summasi musbat bo‘lishi kerak.' })
  amount!: number;

  @IsString({ message: 'Karta raqami matn ko‘rinishida bo‘lishi kerak.' })
  @Matches(/^(8600|9860)\d{12}$/, {
    message: 'Karta raqami Uzcard/Humo formatida bo‘lishi kerak.',
  })
  cardNumber!: string;

  @IsString({ message: 'Karta egasining ismi matn ko‘rinishida bo‘lishi kerak.' })
  @MinLength(3, { message: 'Karta egasi ismi kamida 3 ta belgi bo‘lishi kerak.' })
  @MaxLength(60, {
    message: 'Karta egasi ismi 60 belgidan oshmasligi kerak.',
  })
  cardHolder!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'Izoh 300 belgidan oshmasligi kerak.' })
  comment?: string;
}
