import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const toStringArray = (value: unknown): string[] | undefined => {
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
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }

  return undefined;
};

export class CreateProductDto {
  @IsString({ message: 'Mahsulot nomini matn ko‘rinishida kiriting.' })
  @IsNotEmpty({ message: 'Mahsulot nomi majburiy maydon.' })
  @MaxLength(200, { message: 'Mahsulot nomi 200 belgidan oshmasligi kerak.' })
  title!: string;

  @IsString({ message: 'Mahsulot tavsifi matn bo‘lishi kerak.' })
  @IsNotEmpty({ message: 'Mahsulot tavsifi majburiy.' })
  description!: string;

  @Type(() => Number)
  @IsPositive({ message: 'Narx musbat son bo‘lishi kerak.' })
  price!: number;

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray({ message: 'Rasmlar ro‘yxat ko‘rinishida bo‘lishi kerak.' })
  @ArrayMaxSize(10, { message: 'Rasmlar soni 10 tadan oshmasligi kerak.' })
  @IsString({ each: true, message: 'Har bir rasm yo‘li matn bo‘lishi kerak.' })
  images?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Soni butun son bo‘lishi kerak.' })
  @Min(0, { message: 'Soni 0 dan kichik bo‘lishi mumkin emas.' })
  stock?: number;
}
