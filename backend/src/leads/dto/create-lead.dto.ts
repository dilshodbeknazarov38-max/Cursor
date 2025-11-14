import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty({ message: 'Oqim slug qiymati majburiy.' })
  @MaxLength(64, { message: 'Slug 64 belgidan oshmasligi kerak.' })
  flowSlug!: string;

  @IsString()
  @IsOptional()
  @MaxLength(120, { message: 'Ism 120 belgidan oshmasligi kerak.' })
  name?: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefon raqami majburiy.' })
  @Matches(/^[+0-9\s()-]{7,20}$/, {
    message: 'Telefon raqami noto‘g‘ri formatda.',
  })
  phone!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Eslatma 500 belgidan oshmasligi kerak.' })
  notes?: string;
}
