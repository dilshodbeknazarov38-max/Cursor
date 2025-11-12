import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8, { message: 'Yangi parol kamida 8 ta belgi bo‘lishi kerak.' })
  password!: string;

  @IsString()
  @MinLength(8, {
    message: 'Parolni tasdiqlash kamida 8 ta belgi bo‘lishi kerak.',
  })
  confirmPassword!: string;
}
