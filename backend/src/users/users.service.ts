import {
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

const PASSWORD_SALT_ROUNDS = 10;

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

  async createTargetologist(payload: CreateUserDto): Promise<SafeUser> {
    await this.ensureRoleExists('TARGETOLOG', 'Targetolog');

    const existing = await this.prisma.user.findUnique({
      where: { phone: payload.phone },
    });

    if (existing) {
      throw new ConflictException(
        'Ushbu telefon raqami allaqachon ro‘yxatdan o‘tgan.',
      );
    }

    const passwordHash = await bcrypt.hash(
      payload.password,
      PASSWORD_SALT_ROUNDS,
    );

    const role = await this.prisma.role.findUniqueOrThrow({
      where: { slug: 'TARGETOLOG' },
    });

    const user = await this.prisma.user.create({
      data: {
        firstName: payload.firstName,
        nickname: payload.nickname,
        phone: payload.phone,
        passwordHash,
        roleId: role.id,
        status: UserStatus.ACTIVE,
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

    const existing = await this.prisma.user.findUnique({
      where: { phone: payload.phone },
    });

    if (existing) {
      throw new ConflictException(
        'Ushbu telefon raqami allaqachon ro‘yxatdan o‘tgan.',
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
        nickname: payload.nickname,
        phone: payload.phone,
        passwordHash,
        roleId: role.id,
        status: UserStatus.ACTIVE,
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

    if (performer.role !== 'ADMIN') {
      throw new ForbiddenException('Faqat Admin rolni o‘zgartirishi mumkin.');
    }

    const role = await this.prisma.role.findUnique({
      where: { slug: roleSlug },
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
      action: `Foydalanuvchi roli o‘zgartirildi: ${roleSlug}`,
      meta: {
        targetUserId: userId,
        newRole: roleSlug,
      },
    });

    await this.notificationsService.create({
      toUserId: userId,
      message: `Sizning rolingiz ${role.name} ga o‘zgartirildi.`,
      type: NotificationType.USER,
      metadata: {
        newRole: roleSlug,
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

    if (performedBy.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Foydalanuvchi statusini o‘zgartirishga ruxsatingiz yo‘q.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
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
}
