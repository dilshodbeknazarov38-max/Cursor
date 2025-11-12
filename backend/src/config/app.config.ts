import { registerAs } from '@nestjs/config';

export const APP_CONFIG = registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT ?? process.env.PORT ?? '3001', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  forgotPasswordTokenTtlMinutes: parseInt(
    process.env.FORGOT_PASSWORD_TOKEN_TTL_MINUTES ?? '10',
    10,
  ),
}));
