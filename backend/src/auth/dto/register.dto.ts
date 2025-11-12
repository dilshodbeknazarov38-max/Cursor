import { Matches, MinLength } from 'class-validator';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Ismni kiriting.' })
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nickname kiriting.' })
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
  confirmPassword!: string;

  @IsBoolean()
  captcha!: boolean;
}
