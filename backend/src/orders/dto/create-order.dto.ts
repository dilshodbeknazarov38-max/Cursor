import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'Mahsulot ID si majburiy.' })
  productId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Targetolog foydalanuvchi ID si majburiy.' })
  targetologId!: string;

  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'Buyurtma summasi noto‘g‘ri.' },
  )
  @IsPositive({ message: 'Buyurtma summasi musbat bo‘lishi kerak.' })
  amount!: number;

  @IsOptional()
  @IsString({ message: 'Operator ID si noto‘g‘ri.' })
  operatorId?: string;

  @IsOptional()
  @IsString({ message: 'Lead ID si noto‘g‘ri kirildi.' })
  leadId?: string;
}
