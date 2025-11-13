import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AdjustStockDto {
  @IsString({ message: 'Mahsulot ID si noto‘g‘ri.' })
  @IsNotEmpty({ message: 'Mahsulot ID si majburiy.' })
  productId!: string;

  @IsEnum(['increase', 'decrease'], {
    message: 'Amal noto‘g‘ri. increase yoki decrease bo‘lishi kerak.',
  })
  type!: 'increase' | 'decrease';

  @IsInt({ message: 'Miqdor butun son bo‘lishi kerak.' })
  @Min(1, { message: 'Miqdor kamida 1 bo‘lishi kerak.' })
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Izoh 200 belgidan oshmasligi kerak.' })
  reason?: string;
}
