import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ProductStatus } from '@prisma/client';

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter((item) => item.length > 0);
      }
    } catch {
      // falls through to comma separated
    }
    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return undefined;
}

export class CreateProductDto {
  @IsString({ message: 'Mahsulot nomini matn ko‘rinishida kiriting.' })
  @MinLength(3, { message: 'Mahsulot nomi kamida 3 ta belgi bo‘lishi kerak.' })
  @MaxLength(120, {
    message: 'Mahsulot nomi 120 belgidan oshmasligi kerak.',
  })
  name!: string;

  @IsString({ message: 'Kategoriya matn bo‘lishi kerak.' })
  @MinLength(2, { message: 'Kategoriya kamida 2 ta belgi bo‘lishi kerak.' })
  @MaxLength(60, { message: 'Kategoriya 60 belgidan oshmasligi kerak.' })
  category!: string;

  @IsString({ message: 'Qisqa tavsif matn bo‘lishi kerak.' })
  @MinLength(10, {
    message: 'Qisqa tavsif kamida 10 ta belgi bo‘lishi kerak.',
  })
  @MaxLength(240, {
    message: 'Qisqa tavsif 240 belgidan oshmasligi kerak.',
  })
  shortDescription!: string;

  @IsOptional()
  @IsString({ message: 'To‘liq tavsif matn bo‘lishi kerak.' })
  @MinLength(20, {
    message: 'To‘liq tavsif kamida 20 ta belgi bo‘lishi kerak.',
  })
  fullDescription?: string;

  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'Narx maydonida noto‘g‘ri qiymat: faqat raqam kiriting.' },
  )
  @IsPositive({ message: 'Narx musbat son bo‘lishi kerak.' })
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'CPA (targetolog) noto‘g‘ri formatda.' },
  )
  @Min(0, { message: 'CPA (targetolog) manfiy bo‘lishi mumkin emas.' })
  cpaTargetolog?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'CPA (operator) noto‘g‘ri formatda.' },
  )
  @Min(0, { message: 'CPA (operator) manfiy bo‘lishi mumkin emas.' })
  cpaOperator?: number;

  @IsOptional()
  @IsString({ message: 'SEO sarlavha matn bo‘lishi kerak.' })
  @MaxLength(120, { message: 'SEO sarlavha 120 belgidan oshmasligi kerak.' })
  seoTitle?: string;

  @IsOptional()
  @IsString({ message: 'SEO tavsif matn bo‘lishi kerak.' })
  @MaxLength(180, { message: 'SEO tavsif 180 belgidan oshmasligi kerak.' })
  seoDescription?: string;

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray({ message: 'Taglar ro‘yxat ko‘rinishida bo‘lishi kerak.' })
  @ArrayMaxSize(20, { message: 'Taglar soni 20 tadan oshmasligi kerak.' })
  @IsString({ each: true, message: 'Har bir tag matn bo‘lishi kerak.' })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray({ message: 'Trafik manbalari ro‘yxat ko‘rinishida bo‘lishi kerak.' })
  @ArrayMaxSize(20, {
    message: 'Trafik manbalari soni 20 tadan oshmasligi kerak.',
  })
  @IsString({ each: true, message: 'Har bir trafik manbasi matn bo‘lishi kerak.' })
  trafficSources?: string[];

  @IsOptional()
  @IsString({ message: 'Marketplace ID matn bo‘lishi kerak.' })
  @MaxLength(100, { message: 'Marketplace ID 100 belgidan oshmasligi kerak.' })
  marketplaceId?: string;

  @IsOptional()
  @IsUrl(undefined, {
    message: 'External link noto‘g‘ri formatda (to‘liq URL kiriting).',
  })
  externalUrl?: string;

  @IsOptional()
  @IsEnum(ProductStatus, {
    message: 'Status noto‘g‘ri formatda kiritildi.',
  })
  status?: ProductStatus;

  @IsOptional()
  @IsString({ message: 'Sotuvchi foydalanuvchi ID si noto‘g‘ri.' })
  sellerId?: string;
}
