import { registerAs } from '@nestjs/config';

export const APP_CONFIG = registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT ?? process.env.PORT ?? '3001', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  publicUrl:
    process.env.APP_PUBLIC_URL ??
    process.env.API_PUBLIC_URL ??
    `http://localhost:${process.env.APP_PORT ?? process.env.PORT ?? '3001'}`,
  corsOrigins:
    process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) ??
    [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
    ],
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  forgotPasswordTokenTtlMinutes: parseInt(
    process.env.FORGOT_PASSWORD_TOKEN_TTL_MINUTES ?? '10',
    10,
  ),
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? null,
    chatId: process.env.TELEGRAM_CHAT_ID ?? null,
  },
  payoutLimits: {
    minAmount: Number(process.env.PAYOUT_MIN_AMOUNT ?? 0),
    dailyAmountLimit: Number(process.env.PAYOUT_DAILY_AMOUNT_LIMIT ?? 0),
    monthlyAmountLimit: Number(process.env.PAYOUT_MONTHLY_AMOUNT_LIMIT ?? 0),
    dailyRequestLimit: Number(process.env.PAYOUT_DAILY_REQUEST_LIMIT ?? 0),
  },
}));
