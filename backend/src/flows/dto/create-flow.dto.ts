import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateFlowDto {
  @IsString({ message: 'Oqim nomi matn bo‘lishi kerak.' })
  @IsNotEmpty({ message: 'Oqim nomi majburiy.' })
  @MaxLength(150, { message: 'Oqim nomi 150 belgidan oshmasligi kerak.' })
  title!: string;

  @IsString({ message: 'Mahsulot ID si noto‘g‘ri.' })
  @IsNotEmpty({ message: 'Mahsulot ID si majburiy.' })
  productId!: string;

}
