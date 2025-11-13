import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateFlowDto {
  @IsString({ message: 'Oqim nomi matn bo‘lishi kerak.' })
  @IsNotEmpty({ message: 'Oqim nomi majburiy.' })
  @MaxLength(150, { message: 'Oqim nomi 150 belgidan oshmasligi kerak.' })
  title!: string;

  @IsString({ message: 'Mahsulot ID si noto‘g‘ri.' })
  @IsNotEmpty({ message: 'Mahsulot ID si majburiy.' })
  productId!: string;

  @IsOptional()
  @IsString({ message: 'Slug noto‘g‘ri formatda.' })
  @Matches(/^[a-z0-9-]{3,32}$/i, {
    message: 'Slug faqat lotin harflari, raqamlar va chiziqchadan iborat bo‘lishi kerak (3-32).',
  })
  slug?: string;
}
