import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  APP_PORT?: string;

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;

  @IsOptional()
  @IsString()
  APP_PUBLIC_URL?: string;

  @IsOptional()
  @IsString()
  API_PUBLIC_URL?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  FORGOT_PASSWORD_TOKEN_TTL_MINUTES?: number;

  @IsOptional()
  @IsString()
  ADMIN_PHONE?: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD?: string;

  @IsOptional()
  @IsString()
  ADMIN_NAME?: string;

  @IsOptional()
  @IsString()
  ADMIN_NICKNAME?: string;

  @IsOptional()
  @IsString()
  TELEGRAM_BOT_TOKEN?: string;

  @IsOptional()
  @IsString()
  TELEGRAM_CHAT_ID?: string;

  @IsOptional()
  @IsString()
  PAYOUT_MIN_AMOUNT?: string;

  @IsOptional()
  @IsString()
  PAYOUT_DAILY_AMOUNT_LIMIT?: string;

  @IsOptional()
  @IsString()
  PAYOUT_MONTHLY_AMOUNT_LIMIT?: string;

  @IsOptional()
  @IsString()
  PAYOUT_DAILY_REQUEST_LIMIT?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Konfiguratsiya noto‘g‘ri: ${errors
        .map((error) => Object.values(error.constraints ?? {}).join(', '))
        .join('; ')}`,
    );
  }

  return validatedConfig;
}
