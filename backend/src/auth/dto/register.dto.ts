import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Ismni kiriting.' })
  ism!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nickname kiriting.' })
  nickname!: string;

  @IsString()
  @Matches(/^\+998\d{9}$/, {
    message: 'Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak.',
  })
  telefon!: string;

  @IsString()
  @MinLength(8, { message: 'Parol kamida 8 ta belgi bo‘lishi kerak.' })
  parol!: string;

  @IsString()
  @MinLength(8, { message: 'Parol kamida 8 ta belgi bo‘lishi kerak.' })
  parolTasdiq!: string;

  @IsBoolean()
  captcha!: boolean;
}
