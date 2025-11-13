import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { createHash, randomBytes } from 'crypto';

import { ActivityService } from '@/activity/activity.service';
import { durationToSeconds } from '@/common/utils/duration.util';
import { PrismaService } from '@/prisma/prisma.service';
import { SafeUser, UsersService } from '@/users/users.service';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { JwtPayload } from './jwt.strategy';
import { UserStatus } from '@prisma/client';

type TokensResult = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

type RequestContext = {
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly activityService: ActivityService,
  ) {}

  async register(payload: RegisterDto, context?: RequestContext) {
    if (!payload.captcha) {
      throw new BadRequestException(
        'Davom etish uchun “Men robot emasman” ni tasdiqlang.',
      );
    }

    if (payload.password !== payload.passwordConfirm) {
      throw new BadRequestException('Parollar mos kelmadi.');
    }

    const safeUser = await this.usersService.createSelfRegisteredUser(
      {
        firstName: payload.firstName.trim(),
        phone: payload.phone.trim(),
        nickname: payload.nickname.trim(),
        password: payload.password,
        referralCode: payload.referralCode?.trim() || null,
      },
    );

    const tokens = await this.issueTokens(safeUser, false);

    await this.activityService.log({
      userId: safeUser.id,
      action: 'Foydalanuvchi ro‘yxatdan o‘tdi.',
      ip: context?.ip,
      device: context?.userAgent,
      meta: {
        phone: safeUser.phone,
        nickname: safeUser.nickname,
        role: safeUser.role?.slug ?? 'TARGETOLOG',
      },
    });

    return {
      message: 'Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi.',
      user: safeUser,
      ...tokens,
    };
  }

  async login(payload: LoginDto, context?: RequestContext) {
    if (!payload.captcha) {
      throw new BadRequestException(
        'Davom etish uchun “Men robot emasman” ni tasdiqlang.',
      );
    }

    const user = await this.usersService.findByPhone(payload.telefon);
    if (!user) {
      throw new UnauthorizedException('Login yoki parol noto‘g‘ri.');
    }

    if (user.status === UserStatus.BLOCKED) {
      await this.activityService.log({
        userId: user.id,
        action: 'Muvaffaqiyatsiz kirish: hisob bloklangan.',
        ip: context?.ip,
        device: context?.userAgent,
      });
      throw new ForbiddenException(
        'Hisobingiz bloklangan. Administrator bilan bog‘laning.',
      );
    }

    if (user.status === UserStatus.INACTIVE) {
      await this.activityService.log({
        userId: user.id,
        action: 'Muvaffaqiyatsiz kirish: hisob faol emas.',
        ip: context?.ip,
        device: context?.userAgent,
      });
      throw new ForbiddenException(
        'Hisobingiz faol emas. Administrator bilan bog‘laning.',
      );
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      payload.parol,
    );
    if (!isPasswordValid) {
      await this.activityService.log({
        userId: user.id,
        action: 'Muvaffaqiyatsiz kirish: noto‘g‘ri parol.',
        ip: context?.ip,
        device: context?.userAgent,
        meta: {
          rememberMe: payload.rememberMe ?? false,
        },
      });
      throw new UnauthorizedException('Login yoki parol noto‘g‘ri.');
    }

    await this.revokeUserRefreshTokens(user.id);

    const safeUser = this.usersService.toSafeUser(user);
    const tokens = await this.issueTokens(
      safeUser,
      payload.rememberMe ?? false,
    );

    await this.usersService.markLastLogin(user.id);

    await this.activityService.log({
      userId: user.id,
      action: 'Tizimga kirish amalga oshirildi.',
      ip: context?.ip,
      device: context?.userAgent,
      meta: {
        rememberMe: payload.rememberMe ?? false,
      },
    });

    return {
      message: 'Kirish muvaffaqiyatli.',
      user: safeUser,
      ...tokens,
    };
  }

  async refresh(payload: RefreshTokenDto) {
    const { refreshToken } = payload;
    let decoded: JwtPayload;
    try {
      decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Yangilash tokeni yaroqsiz.');
    }

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId: decoded.sub,
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException(
        'Yangilash tokeni topilmadi yoki muddatidan o‘tgan.',
      );
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findById(decoded.sub);
    const tokens = await this.issueTokens(user, true);

    return {
      message: 'Tokenlar yangilandi.',
      user,
      ...tokens,
    };
  }

  async forgotPassword(payload: ForgotPasswordDto) {
    const user = await this.usersService.findByPhone(payload.telefon);

    if (!user) {
      return {
        message:
          'Agar telefon raqami ro‘yxatdan o‘tgan bo‘lsa, tiklash havolasi yuborildi.',
      };
    }

    const ttlMinutes = this.configService.get<number>(
      'app.forgotPasswordTokenTtlMinutes',
      10,
    );

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
      },
    });

    return {
      message:
        'Tiklash havolasi telefon raqamingizga yuborildi (10 daqiqa amal qiladi).',
      token: rawToken,
      expiresInMinutes: ttlMinutes,
    };
  }

  async resetPassword(payload: ResetPasswordDto) {
    if (payload.password !== payload.confirmPassword) {
      throw new BadRequestException('Parollar mos kelmadi.');
    }

    const tokenHash = this.hashToken(payload.token);
    const storedToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.usedAt) {
      throw new BadRequestException(
        'Tiklash tokeni topilmadi yoki allaqachon ishlatilgan.',
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw new BadRequestException(
        'Tiklash tokenining amal qilish muddati tugagan.',
      );
    }

    await this.usersService.updatePassword(
      storedToken.userId,
      payload.password,
    );

    await this.prisma.passwordResetToken.update({
      where: { id: storedToken.id },
      data: { usedAt: new Date() },
    });

    await this.revokeUserRefreshTokens(storedToken.userId);

    const user = await this.usersService.findById(storedToken.userId);
    const tokens = await this.issueTokens(user, false);

    await this.activityService.log({
      userId: storedToken.userId,
      action: 'Parol muvaffaqiyatli yangilandi.',
      meta: {
        resetTokenId: storedToken.id,
      },
    });

    return {
      message: 'Parol muvaffaqiyatli yangilandi.',
      user,
      ...tokens,
    };
  }

  async logout(userId: string, payload: LogoutDto) {
    if (!userId) {
      throw new UnauthorizedException('Foydalanuvchi aniqlanmadi.');
    }

    await this.revokeUserRefreshTokens(userId);

    await this.activityService.log({
      userId,
      action: 'Tizimdan chiqdi.',
      meta: {
        refreshTokenBerildi: Boolean(payload.refreshToken),
      },
    });

    return {
      message: 'Tizimdan chiqish muvaffaqiyatli yakunlandi.',
    };
  }

  private async issueTokens(
    user: SafeUser,
    rememberMe: boolean,
  ): Promise<TokensResult> {
    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      '',
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      '',
    );

    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT sozlamalari topilmadi.');
    }

    const accessExpiresIn = (this.configService.get<string>(
      'app.accessTokenExpiresIn',
      '15m',
    ) ?? '15m') as StringValue;

    const refreshExpiresIn = (
      rememberMe
        ? this.configService.get<string>('app.refreshTokenExpiresIn', '30d')
        : '7d'
    ) as StringValue;

    const roleSlug = user.role?.slug ?? 'TARGETOLOG';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          role: roleSlug,
        },
        {
          secret: accessSecret,
          expiresIn: accessExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: user.id,
          role: roleSlug,
          type: 'refresh',
        },
        {
          secret: refreshSecret,
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);

    const refreshExpiresSeconds = durationToSeconds(String(refreshExpiresIn));
    const refreshTokenExpiresAt = new Date(
      Date.now() + refreshExpiresSeconds * 1000,
    );

    await this.storeRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
  ) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  private async revokeUserRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
