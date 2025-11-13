import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]{8,}$/;

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Ism kamida 2 ta belgi bo‘lishi kerak.' })
  firstName!: string;

  @IsString()
  @MinLength(2, { message: 'Familiya kamida 2 ta belgi bo‘lishi kerak.' })
  lastName!: string;

  @IsEmail({}, { message: 'Yaroqli email manzilini kiriting.' })
  email!: string;

  @IsString()
  @Matches(/^\+998\d{9}$/, {
    message: 'Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak.',
  })
  phone!: string;

  @IsString()
  @Matches(PASSWORD_REGEX, {
    message:
      'Parol kamida 8 ta belgi, bitta katta harf, bitta kichik harf va raqamdan iborat bo‘lishi kerak.',
  })
  password!: string;

  @IsString()
  @Matches(PASSWORD_REGEX, {
    message:
      'Parol kamida 8 ta belgi, bitta katta harf, bitta kichik harf va raqamdan iborat bo‘lishi kerak.',
  })
  passwordConfirm!: string;

  @IsIn(['TARGETOLOG', 'SOTUVCHI'], {
    message: 'Rol sifatida faqat Targetolog yoki Sotuvchi tanlanishi mumkin.',
  })
  role!: 'TARGETOLOG' | 'SOTUVCHI';

  @IsBoolean()
  termsAccepted!: boolean;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsBoolean()
  captcha!: boolean;
}
