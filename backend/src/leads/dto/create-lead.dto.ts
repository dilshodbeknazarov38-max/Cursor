import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty({ message: 'Mahsulot ID si majburiy.' })
  productId!: string;

  @IsString()
  @IsOptional()
  targetologId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Eslatma 500 belgidan oshmasligi kerak.' })
  notes?: string;
}
