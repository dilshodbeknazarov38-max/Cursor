import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Ism kamida 2 ta belgi bo‘lishi kerak.' })
  firstName!: string;

  @IsString()
  @MinLength(3, { message: 'Nickname kamida 3 ta belgi bo‘lishi kerak.' })
  nickname!: string;

  @IsString()
  @Matches(/^\+998\d{9}$/, {
    message: 'Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak.',
  })
  phone!: string;

  @IsString()
  @MinLength(8, { message: 'Parol kamida 8 ta belgi bo‘lishi kerak.' })
  password!: string;

  @IsString()
  @MinLength(8, { message: 'Parol kamida 8 ta belgi bo‘lishi kerak.' })
  passwordConfirm!: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsBoolean()
  captcha!: boolean;
}
