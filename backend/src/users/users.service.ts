import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { ActivityService } from '@/activity/activity.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';
import { AdminListUsersQueryDto } from './dto/admin-list-users-query.dto';

const PASSWORD_SALT_ROUNDS = 10;

const normalizeRoleSlug = (value: string) =>
  value
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .toUpperCase();

type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;
export type SafeUser = Omit<UserWithRole, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private ensureRoleExists(slug: string, name: string, description?: string) {
    return this.prisma.role.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        description,
      },
    });
  }

  async createSelfRegisteredUser(payload: {
    firstName: string;
    nickname: string;
    phone: string;
    password: string;
    roleSlug?: 'TARGETOLOG' | 'TAMINOTCHI';
    email?: string | null;
    lastName?: string | null;
    referralCode?: string | null;
  }): Promise<SafeUser> {
    const allowedRoles: Record<'TARGETOLOG' | 'TAMINOTCHI', string> = {
      TARGETOLOG: 'Targetolog',
      TAMINOTCHI: 'Ta’minotchi',
    };

      const normalizedRole = (payload.roleSlug ?? 'TARGETOLOG').toUpperCase() as
        | 'TARGETOLOG'
        | 'TAMINOTCHI';

    if (!(normalizedRole in allowedRoles)) {
      throw new BadRequestException(
        'Tanlangan rolni ro‘yxatdan o‘tish orqali olish mumkin emas.',
      );
    }

    await this.ensureRoleExists(normalizedRole, allowedRoles[normalizedRole]);

    const [existingByPhone, existingByEmail] = await Promise.all([
        this.prisma.user.findUnique({
          where: { phone: payload.phone },
        }),
        payload.email
          ? this.prisma.user.findUnique({
              where: { email: payload.email },
            })
          : Promise.resolve(null),
    ]);

    if (existingByPhone) {
      throw new ConflictException(
        'Ushbu telefon raqami allaqachon ro‘yxatdan o‘tgan.',
      );
    }

    if (existingByEmail) {
      throw new ConflictException(
        'Ushbu email manzili allaqachon ro‘yxatdan o‘tgan.',
      );
    }

    const passwordHash = await bcrypt.hash(
      payload.password,
      PASSWORD_SALT_ROUNDS,
    );

    const role = await this.prisma.role.findUniqueOrThrow({
      where: { slug: normalizedRole },
    });

    const nickname =
      payload.nickname?.trim().length > 0
        ? payload.nickname.trim()
        : this.generateNickname(payload.firstName, payload.lastName ?? undefined);

    const user = await this.prisma.user.create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName ?? null,
        email: payload.email ?? null,
        nickname,
        phone: payload.phone,
        passwordHash,
        roleId: role.id,
        status: UserStatus.ACTIVE,
        referralCode: payload.referralCode ?? null,
        termsAcceptedAt: new Date(),
      },
      include: { role: true },
    });

    return this.toSafeUser(user);
  }

  async createByAdmin(
    payload: CreateUserDto,
    createdByRole: string,
  ): Promise<SafeUser> {
    if (createdByRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Faqat Admin foydalanuvchi yaratishi mumkin.',
      );
    }

    const [existingByPhone, existingByEmail] = await Promise.all([
      this.prisma.user.findUnique({
        where: { phone: payload.phone },
      }),
      payload.email
        ? this.prisma.user.findUnique({
            where: { email: payload.email },
          })
        : Promise.resolve(null),
    ]);

    if (existingByPhone) {
      throw new ConflictException(
        'Ushbu telefon raqami allaqachon ro‘yxatdan o‘tgan.',
      );
    }

    if (existingByEmail) {
      throw new ConflictException(
        'Ushbu email manzili allaqachon ro‘yxatdan o‘tgan.',
      );
    }

    const roleSlug = (payload.roleSlug ?? 'TARGETOLOG').toUpperCase();

    const role = await this.prisma.role.findUnique({
      where: { slug: roleSlug },
    });

    if (!role) {
      throw new NotFoundException('Belgilanayotgan rol topilmadi.');
    }

    const passwordHash = await bcrypt.hash(
      payload.password,
      PASSWORD_SALT_ROUNDS,
    );

    const user = await this.prisma.user.create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName ?? null,
        email: payload.email ?? null,
        nickname:
          payload.nickname ??
          this.generateNickname(payload.firstName, payload.lastName ?? ''),
        phone: payload.phone,
        passwordHash,
        roleId: role.id,
        status: UserStatus.ACTIVE,
        referralCode: payload.referralCode ?? null,
      },
      include: { role: true },
    });

    return this.toSafeUser(user);
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.toSafeUser(user));
  }

  async adminListUsers(
    query: AdminListUsersQueryDto,
  ): Promise<{
    data: SafeUser[];
    meta: {
      totalItems: number;
      totalPages: number;
      page: number;
      limit: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const roleFilter = query.role?.trim();

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleFilter) {
      where.role = { slug: normalizeRoleSlug(roleFilter) };
    }

    if (query.status) {
      where.status = query.status;
    }

    const [users, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      data: users.map((user) => this.toSafeUser(user)),
      meta: {
        totalItems,
        totalPages,
        page,
        limit,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findByPhone(phone: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      where: { phone },
      include: { role: true },
    });
  }

  async findById(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
    }
    return this.toSafeUser(user);
  }

  async validatePassword(
    user: UserWithRole,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updatePassword(userId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async updateRole(
    userId: string,
    roleSlug: string,
    performer: { userId: string; role: string },
  ): Promise<SafeUser> {
    if (!performer.userId) {
      throw new ForbiddenException(
        'Amalni bajarish uchun foydalanuvchi aniqlanmadi.',
      );
    }

    const performerRole = performer.role?.toUpperCase();
    if (performerRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Faqat Super Admin foydalanuvchi rollarini o‘zgartirishi mumkin.',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!existingUser) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
    }

    if (
      existingUser.role?.slug === 'SUPER_ADMIN' &&
      performer.userId !== userId
    ) {
      throw new ForbiddenException(
        'Boshqa Super Admin hisobini o‘zgartira olmaysiz.',
      );
    }

    const normalizedRoleSlug = normalizeRoleSlug(roleSlug);

    const role = await this.prisma.role.findUnique({
      where: { slug: normalizedRoleSlug },
    });

    if (!role) {
      throw new NotFoundException('Belgilangan rol topilmadi.');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: role.id },
      include: { role: true },
    });

    await this.activityService.log({
      userId: performer.userId,
      action: `Foydalanuvchi roli o‘zgartirildi: ${normalizedRoleSlug}`,
      meta: {
        targetUserId: userId,
        newRole: normalizedRoleSlug,
      },
    });

    await this.notificationsService.create({
      toUserId: userId,
      message: `Sizning rolingiz ${role.name} ga o‘zgartirildi.`,
      type: NotificationType.USER,
      metadata: {
        newRole: normalizedRoleSlug,
      },
    });

    return this.toSafeUser(user);
  }

  async remove(userId: string, performedByRole: string): Promise<void> {
    if (performedByRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Faqat Admin foydalanuvchini o‘chirishi mumkin.',
      );
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async updateStatus(
    userId: string,
    status: UserStatus,
    performedBy: { userId: string; role: string; reason?: string },
  ): Promise<SafeUser> {
    if (!performedBy.userId) {
      throw new ForbiddenException(
        'Amalni bajarish uchun foydalanuvchi aniqlanmadi.',
      );
    }

    const performerRole = performedBy.role?.toUpperCase();
    if (performerRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Faqat Super Admin foydalanuvchi statusini o‘zgartirishi mumkin.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
    }

    if (user.role?.slug === 'SUPER_ADMIN' && performedBy.userId !== userId) {
      throw new ForbiddenException(
        'Boshqa Super Admin hisobini o‘zgartira olmaysiz.',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status,
        blockedAt: status === UserStatus.BLOCKED ? new Date() : null,
      },
      include: { role: true },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.activityService.log({
      userId: performedBy.userId,
      action: `Foydalanuvchi statusi yangilandi: ${status}`,
      meta: {
        targetUserId: userId,
        status,
        reason: performedBy.reason ?? null,
      },
    });

    await this.notificationsService.create({
      toUserId: userId,
      message: `Sizning hisobingiz statusi: ${status}.`,
      type: NotificationType.USER,
      metadata: {
        status,
        reason: performedBy.reason ?? null,
      },
    });

    return this.toSafeUser(updated);
  }

  async markLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  toSafeUser(user: UserWithRole): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  listRoles(): Promise<Role[]> {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  private generateNickname(firstName: string, lastName?: string) {
    const base = `${firstName}.${lastName ?? ''}`
      .replace(/\s+/g, '-')
      .replace(/[^A-Za-z0-9._-]/g, '')
      .toLowerCase();
    return base.length > 3 ? base : `${base}${Math.floor(Math.random() * 999)}`;
  }
}
