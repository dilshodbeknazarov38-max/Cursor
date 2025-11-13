import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

const DEFAULT_ROLES = [
  {
    name: 'Admin',
    slug: 'ADMIN',
    description: 'Tizimning barcha modul va foydalanuvchilarini boshqaradi.',
  },
  {
    name: 'Super Admin',
    slug: 'SUPER_ADMIN',
    description: 'Foydalanuvchilar va hisobotlarni kuzatadi.',
  },
  {
    name: 'Oper Admin',
    slug: 'OPER_ADMIN',
    description: 'Operatorlar va buyurtmalar jarayonini boshqaradi.',
  },
  {
    name: 'Target Admin',
    slug: 'TARGET_ADMIN',
    description: 'Targetologlar va ularning lidlarini boshqaradi.',
  },
  {
    name: 'Seller Admin',
    slug: 'SELLER_ADMIN',
    description: 'Sotuvchilar va ularning samaradorligini nazorat qiladi.',
  },
  {
    name: 'Sklad Admin',
    slug: 'SKLAD_ADMIN',
    description: 'Ombor va yetkazib berish jarayonini boshqaradi.',
  },
  {
    name: 'Targetolog',
    slug: 'TARGETOLOG',
    description: 'O‘zining lidlari, statistika va to‘lovlarini ko‘radi.',
  },
  {
    name: 'Sotuvchi',
    slug: 'SOTUVCHI',
    description: 'Mahsulotlar, buyurtmalar va balansini kuzatadi.',
  },
  {
    name: 'Operator',
    slug: 'OPERATOR',
    description: 'Biriktirilgan buyurtmalar ustida ishlaydi.',
  },
];

const DEFAULT_PERMISSIONS = [
  { name: 'Foydalanuvchilarni boshqarish', slug: 'MANAGE_USERS' },
  { name: 'Mahsulotlarni boshqarish', slug: 'MANAGE_PRODUCTS' },
  { name: 'Buyurtmalarni boshqarish', slug: 'MANAGE_ORDERS' },
  { name: 'To‘lovlarni boshqarish', slug: 'MANAGE_PAYMENTS' },
  { name: 'Bildirishnomalarni boshqarish', slug: 'MANAGE_NOTIFICATIONS' },
  { name: 'Foydalanuvchilarni ko‘rish', slug: 'VIEW_USERS' },
  { name: 'Hisobotlarni ko‘rish', slug: 'VIEW_REPORTS' },
  { name: 'Operatorlarni boshqarish', slug: 'MANAGE_OPERATORS' },
  { name: 'Targetologlarni boshqarish', slug: 'MANAGE_TARGETOLOGS' },
  { name: 'Lidlarni boshqarish', slug: 'MANAGE_LEADS' },
  { name: 'Sotuvchilarni boshqarish', slug: 'MANAGE_SELLERS' },
  { name: 'Omborni boshqarish', slug: 'MANAGE_WAREHOUSE' },
  { name: 'Lidlarni ko‘rish', slug: 'VIEW_LEADS' },
  { name: 'Statistikani ko‘rish', slug: 'VIEW_STATS' },
  { name: 'To‘lovlarni ko‘rish', slug: 'VIEW_PAYOUTS' },
  { name: 'Biriktirilgan buyurtmalarni boshqarish', slug: 'HANDLE_ORDERS' },
];

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  ADMIN: [
    'MANAGE_USERS',
    'MANAGE_PRODUCTS',
    'MANAGE_ORDERS',
    'MANAGE_PAYMENTS',
    'MANAGE_NOTIFICATIONS',
    'VIEW_REPORTS',
    'MANAGE_OPERATORS',
    'MANAGE_TARGETOLOGS',
    'MANAGE_LEADS',
    'MANAGE_SELLERS',
    'MANAGE_WAREHOUSE',
    'VIEW_LEADS',
    'VIEW_STATS',
    'VIEW_PAYOUTS',
    'HANDLE_ORDERS',
  ],
  SUPER_ADMIN: ['VIEW_USERS', 'VIEW_REPORTS'],
  OPER_ADMIN: ['MANAGE_OPERATORS', 'MANAGE_ORDERS', 'HANDLE_ORDERS'],
  TARGET_ADMIN: [
    'MANAGE_TARGETOLOGS',
    'MANAGE_LEADS',
    'VIEW_LEADS',
    'VIEW_STATS',
  ],
  SELLER_ADMIN: ['MANAGE_SELLERS', 'VIEW_STATS'],
  SKLAD_ADMIN: ['MANAGE_WAREHOUSE', 'HANDLE_ORDERS'],
  TARGETOLOG: ['VIEW_LEADS', 'VIEW_STATS', 'VIEW_PAYOUTS'],
  SOTUVCHI: ['VIEW_STATS', 'VIEW_PAYOUTS'],
  OPERATOR: ['HANDLE_ORDERS', 'VIEW_LEADS'],
};

const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAccessControl();
  }

  getHello(): string {
    return 'CPAMaRKeT.Uz API tayyor holatda ishlamoqda.';
  }

  private async seedAccessControl() {
    await this.prisma.$transaction(async (tx) => {
      for (const permission of DEFAULT_PERMISSIONS) {
        await tx.permission.upsert({
          where: { slug: permission.slug },
          update: { name: permission.name },
          create: {
            name: permission.name,
            slug: permission.slug,
            description: permission.name,
          },
        });
      }

      const permissions = await tx.permission.findMany();
      const permissionMap = new Map(
        permissions.map((permission) => [permission.slug, permission.id]),
      );

      for (const role of DEFAULT_ROLES) {
        const roleRecord = await tx.role.upsert({
          where: { slug: role.slug },
          update: {
            name: role.name,
            description: role.description,
          },
          create: {
            name: role.name,
            slug: role.slug,
            description: role.description,
          },
        });

        const permissionSlugs = ROLE_PERMISSION_MAP[role.slug] ?? [];
        const permissionIds = permissionSlugs
          .map((slug) => permissionMap.get(slug))
          .filter((id): id is string => Boolean(id));

        await tx.rolePermission.deleteMany({
          where: { roleId: roleRecord.id },
        });

        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId: roleRecord.id,
              permissionId,
            })),
            skipDuplicates: true,
          });
        }
      }

      await this.ensureDefaultAdmin(tx);
    });
  }

  private async ensureDefaultAdmin(tx: PrismaService) {
    const adminPhone = this.configService.get<string>('ADMIN_PHONE');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminPhone || !adminPassword) {
      return;
    }

    const adminName =
      this.configService.get<string>('ADMIN_NAME') ?? 'Super Admin';
    const adminNickname =
      this.configService.get<string>('ADMIN_NICKNAME') ?? 'superadmin';

    const adminRole = await tx.role.findUnique({
      where: { slug: 'ADMIN' },
    });

    if (!adminRole) {
      return;
    }

    const passwordHash = await bcrypt.hash(
      adminPassword,
      PASSWORD_SALT_ROUNDS,
    );

    const existing = await tx.user.findUnique({
      where: { phone: adminPhone },
    });

    if (existing) {
      await tx.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          status: UserStatus.ACTIVE,
          blockedAt: null,
        },
      });
      return;
    }

    await tx.user.create({
      data: {
        firstName: adminName,
        nickname: adminNickname,
        phone: adminPhone,
        passwordHash,
        status: UserStatus.ACTIVE,
        roleId: adminRole.id,
      },
    });
  }
}
