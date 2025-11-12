import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^\+998\d{9}$/, {
    message: 'Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak.',
  })
  telefon!: string;

  @IsString()
  @MinLength(8, { message: 'Parol kamida 8 ta belgi bo‘lishi kerak.' })
  parol!: string;

  @IsBoolean()
  captcha!: boolean;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
