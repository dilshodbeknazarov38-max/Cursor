import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Mahsulot nomini kiriting.' })
  @MaxLength(120, { message: 'Mahsulot nomi 120 belgidan oshmasligi kerak.' })
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Tavsif 1000 belgidan oshmasligi kerak.' })
  description?: string;

  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'Narx noto‘g‘ri formatda kiritildi.' },
  )
  @IsPositive({ message: 'Narx musbat son bo‘lishi kerak.' })
  price!: number;

  @IsOptional()
  @IsEnum(ProductStatus, {
    message: 'Status noto‘g‘ri. DRAFT | ACTIVE | INACTIVE | ARCHIVED dan birini tanlang.',
  })
  status?: ProductStatus;

  @IsOptional()
  @IsString({ message: 'Sotuvchi foydalanuvchi ID si noto‘g‘ri.' })
  sellerId?: string;
}
