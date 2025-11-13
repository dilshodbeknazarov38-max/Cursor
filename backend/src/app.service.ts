import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  BalanceAccountType,
  BalanceTransactionType,
  FraudCheckStatus,
  LeadStatus,
  OrderStatus,
  PayoutStatus,
  Prisma,
  ProductStatus,
  UserStatus,
} from '@prisma/client';

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
  { name: 'Admin bosh sahifasini ko‘rish', slug: 'VIEW_ADMIN_DASHBOARD' },
  { name: 'Super Admin bosh sahifasini ko‘rish', slug: 'VIEW_SUPER_ADMIN_DASHBOARD' },
  { name: 'Oper Admin bosh sahifasini ko‘rish', slug: 'VIEW_OPER_ADMIN_DASHBOARD' },
  { name: 'Target Admin bosh sahifasini ko‘rish', slug: 'VIEW_TARGET_ADMIN_DASHBOARD' },
  { name: 'Seller Admin bosh sahifasini ko‘rish', slug: 'VIEW_SELLER_ADMIN_DASHBOARD' },
  { name: 'Sklad Admin bosh sahifasini ko‘rish', slug: 'VIEW_SKLAD_ADMIN_DASHBOARD' },
  { name: 'Targetolog bosh sahifasini ko‘rish', slug: 'VIEW_TARGETOLOG_DASHBOARD' },
  { name: 'Sotuvchi bosh sahifasini ko‘rish', slug: 'VIEW_SELLER_DASHBOARD' },
  { name: 'Operator bosh sahifasini ko‘rish', slug: 'VIEW_OPERATOR_DASHBOARD' },
  { name: 'Operator profillarini boshqarish', slug: 'MANAGE_OPERATOR_PROFILES' },
  { name: 'Operatorlar faoliyatini ko‘rish', slug: 'VIEW_OPERATOR_PERFORMANCE' },
  { name: 'Operator ogohlantirishlarini ko‘rish', slug: 'VIEW_OPERATOR_NOTIFICATIONS' },
  { name: 'Targetolog profillarini boshqarish', slug: 'MANAGE_TARGETOLOG_PROFILES' },
  { name: 'Targetologlar faoliyatini ko‘rish', slug: 'VIEW_TARGETOLOG_PERFORMANCE' },
  { name: 'Targetolog ogohlantirishlarini ko‘rish', slug: 'VIEW_TARGETOLOG_NOTIFICATIONS' },
  { name: 'Sotuvchi profillarini boshqarish', slug: 'MANAGE_SELLER_PROFILES' },
  { name: 'Sotuvchilar faoliyatini ko‘rish', slug: 'VIEW_SELLER_PERFORMANCE' },
  { name: 'Sotuvchi ogohlantirishlarini ko‘rish', slug: 'VIEW_SELLER_NOTIFICATIONS' },
  { name: 'Yetkazib berish jarayonini boshqarish', slug: 'MANAGE_DELIVERY_PIPELINE' },
  { name: 'Ombor hisobotlarini ko‘rish', slug: 'VIEW_WAREHOUSE_REPORTS' },
  { name: 'Yetkazib berish ogohlantirishlarini ko‘rish', slug: 'VIEW_DELIVERY_NOTIFICATIONS' },
  { name: 'Shaxsiy leadlarni ko‘rish', slug: 'VIEW_SELF_LEADS' },
  { name: 'Shaxsiy sotuvlarni ko‘rish', slug: 'VIEW_SELF_SALES' },
  { name: 'Shaxsiy balansni ko‘rish', slug: 'VIEW_SELF_BALANCE' },
  { name: 'Payout so‘rovini yuborish', slug: 'REQUEST_PAYOUT' },
  { name: 'Mahsulot havolalariga kirish', slug: 'ACCESS_PRODUCT_LINKS' },
  { name: 'O‘z mahsulotlarini boshqarish', slug: 'MANAGE_OWN_PRODUCTS' },
  { name: 'O‘z buyurtmalarini ko‘rish', slug: 'VIEW_OWN_ORDERS' },
  { name: 'Biriktirilgan buyurtmalarni ko‘rish', slug: 'VIEW_NEW_ORDERS' },
  { name: 'Buyurtma holatini yangilash', slug: 'UPDATE_ORDER_STATUS' },
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
    'VIEW_ADMIN_DASHBOARD',
    'VIEW_SUPER_ADMIN_DASHBOARD',
    'VIEW_OPER_ADMIN_DASHBOARD',
    'VIEW_TARGET_ADMIN_DASHBOARD',
    'VIEW_SELLER_ADMIN_DASHBOARD',
    'VIEW_SKLAD_ADMIN_DASHBOARD',
    'VIEW_TARGETOLOG_DASHBOARD',
    'VIEW_SELLER_DASHBOARD',
    'VIEW_OPERATOR_DASHBOARD',
    'MANAGE_OPERATOR_PROFILES',
    'VIEW_OPERATOR_PERFORMANCE',
    'VIEW_OPERATOR_NOTIFICATIONS',
    'MANAGE_TARGETOLOG_PROFILES',
    'VIEW_TARGETOLOG_PERFORMANCE',
    'VIEW_TARGETOLOG_NOTIFICATIONS',
    'MANAGE_SELLER_PROFILES',
    'VIEW_SELLER_PERFORMANCE',
    'VIEW_SELLER_NOTIFICATIONS',
    'MANAGE_DELIVERY_PIPELINE',
    'VIEW_WAREHOUSE_REPORTS',
    'VIEW_DELIVERY_NOTIFICATIONS',
    'VIEW_SELF_LEADS',
    'VIEW_SELF_SALES',
    'VIEW_SELF_BALANCE',
    'REQUEST_PAYOUT',
    'ACCESS_PRODUCT_LINKS',
    'MANAGE_OWN_PRODUCTS',
    'VIEW_OWN_ORDERS',
    'VIEW_NEW_ORDERS',
    'UPDATE_ORDER_STATUS',
  ],
  SUPER_ADMIN: [
    'VIEW_SUPER_ADMIN_DASHBOARD',
    'VIEW_USERS',
    'VIEW_REPORTS',
    'VIEW_OPERATOR_PERFORMANCE',
    'VIEW_TARGETOLOG_PERFORMANCE',
    'VIEW_SELLER_PERFORMANCE',
    'VIEW_OPERATOR_NOTIFICATIONS',
    'VIEW_TARGETOLOG_NOTIFICATIONS',
    'VIEW_SELLER_NOTIFICATIONS',
    'VIEW_STATS',
  ],
  OPER_ADMIN: [
    'VIEW_OPER_ADMIN_DASHBOARD',
    'MANAGE_OPERATORS',
    'MANAGE_OPERATOR_PROFILES',
    'MANAGE_ORDERS',
    'HANDLE_ORDERS',
    'VIEW_OPERATOR_PERFORMANCE',
    'VIEW_OPERATOR_NOTIFICATIONS',
    'VIEW_NEW_ORDERS',
    'UPDATE_ORDER_STATUS',
  ],
  TARGET_ADMIN: [
    'VIEW_TARGET_ADMIN_DASHBOARD',
    'MANAGE_TARGETOLOGS',
    'MANAGE_TARGETOLOG_PROFILES',
    'MANAGE_LEADS',
    'VIEW_TARGETOLOG_PERFORMANCE',
    'VIEW_TARGETOLOG_NOTIFICATIONS',
    'VIEW_LEADS',
    'VIEW_STATS',
    'VIEW_REPORTS',
  ],
  SELLER_ADMIN: [
    'VIEW_SELLER_ADMIN_DASHBOARD',
    'MANAGE_SELLERS',
    'MANAGE_SELLER_PROFILES',
    'VIEW_STATS',
    'VIEW_SELLER_PERFORMANCE',
    'VIEW_SELLER_NOTIFICATIONS',
    'VIEW_REPORTS',
  ],
  SKLAD_ADMIN: [
    'VIEW_SKLAD_ADMIN_DASHBOARD',
    'MANAGE_WAREHOUSE',
    'MANAGE_DELIVERY_PIPELINE',
    'HANDLE_ORDERS',
    'VIEW_WAREHOUSE_REPORTS',
    'VIEW_DELIVERY_NOTIFICATIONS',
    'VIEW_OPERATOR_PERFORMANCE',
  ],
  TARGETOLOG: [
    'VIEW_TARGETOLOG_DASHBOARD',
    'VIEW_LEADS',
    'VIEW_STATS',
    'VIEW_PAYOUTS',
    'VIEW_SELF_LEADS',
    'VIEW_SELF_SALES',
    'VIEW_SELF_BALANCE',
    'REQUEST_PAYOUT',
    'ACCESS_PRODUCT_LINKS',
  ],
  SOTUVCHI: [
    'VIEW_SELLER_DASHBOARD',
    'VIEW_STATS',
    'VIEW_PAYOUTS',
    'MANAGE_OWN_PRODUCTS',
    'VIEW_OWN_ORDERS',
    'VIEW_SELF_BALANCE',
    'REQUEST_PAYOUT',
  ],
  OPERATOR: [
    'VIEW_OPERATOR_DASHBOARD',
    'HANDLE_ORDERS',
    'VIEW_NEW_ORDERS',
    'UPDATE_ORDER_STATUS',
    'VIEW_OPERATOR_NOTIFICATIONS',
  ],
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
    await this.seedDemoData();
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

  private async seedDemoData() {
    const existingTransactions = await this.prisma.balanceTransaction.count();
    if (existingTransactions > 0) {
      return;
    }

    const roles = await this.prisma.role.findMany({
      where: {
        slug: {
          in: ['TARGETOLOG', 'SOTUVCHI', 'OPERATOR'],
        },
      },
    });
    const roleMap = new Map(roles.map((role) => [role.slug, role]));

    const targetRole = roleMap.get('TARGETOLOG');
    const sellerRole = roleMap.get('SOTUVCHI');
    const operatorRole = roleMap.get('OPERATOR');

    if (!targetRole || !sellerRole || !operatorRole) {
      return;
    }

    const demoPasswordHash = await bcrypt.hash(
      'Demo1234!',
      PASSWORD_SALT_ROUNDS,
    );

    const targetUser = await this.prisma.user.upsert({
      where: { phone: '+998900000001' },
      update: {
        passwordHash: demoPasswordHash,
        roleId: targetRole.id,
        status: UserStatus.ACTIVE,
      },
      create: {
        firstName: 'Demo Targetolog',
        nickname: 'demo_targetolog',
        phone: '+998900000001',
        passwordHash: demoPasswordHash,
        status: UserStatus.ACTIVE,
        roleId: targetRole.id,
      },
    });

    const sellerUser = await this.prisma.user.upsert({
      where: { phone: '+998900000002' },
      update: {
        passwordHash: demoPasswordHash,
        roleId: sellerRole.id,
        status: UserStatus.ACTIVE,
      },
      create: {
        firstName: 'Demo Sotuvchi',
        nickname: 'demo_sotuvchi',
        phone: '+998900000002',
        passwordHash: demoPasswordHash,
        status: UserStatus.ACTIVE,
        roleId: sellerRole.id,
      },
    });

    const operatorUser = await this.prisma.user.upsert({
      where: { phone: '+998900000003' },
      update: {
        passwordHash: demoPasswordHash,
        roleId: operatorRole.id,
        status: UserStatus.ACTIVE,
      },
      create: {
        firstName: 'Demo Operator',
        nickname: 'demo_operator',
        phone: '+998900000003',
        passwordHash: demoPasswordHash,
        status: UserStatus.ACTIVE,
        roleId: operatorRole.id,
      },
    });

    const productSlug = `demo-product-${sellerUser.id.slice(0, 8)}`;
    const product = await this.prisma.product.upsert({
      where: { slug: productSlug },
      update: {},
      create: {
        name: 'Demo mahsulot',
        slug: productSlug,
        category: 'Demo',
        shortDescription: 'Demo mahsulot uchun qisqa tavsif.',
        fullDescription: 'Demo mahsulotning to‘liq tavsifi.',
        price: new Prisma.Decimal('350000'),
        cpaTargetolog: new Prisma.Decimal('150000'),
        cpaOperator: new Prisma.Decimal('80000'),
        mainImageUrl: '/static/placeholders/product.png',
        smartLinkUrl: 'https://example.com/demo-product',
        status: ProductStatus.ACTIVE,
        sellerId: sellerUser.id,
        tags: ['demo', 'mahsulot'],
        trafficSources: ['facebook', 'instagram'],
      },
    });

    const lead = await this.prisma.lead.create({
      data: {
        productId: product.id,
        targetologId: targetUser.id,
        status: LeadStatus.TASDIQLANGAN,
        notes: 'Demo lid avtomatik yaratilgan.',
      },
    });

    await this.prisma.order.create({
      data: {
        productId: product.id,
        targetologId: targetUser.id,
        operatorId: operatorUser.id,
        leadId: lead.id,
        status: OrderStatus.DELIVERED,
        amount: new Prisma.Decimal('350000'),
      },
    });

    const targetMainAccount = await this.prisma.balanceAccount.upsert({
      where: {
        userId_type: {
          userId: targetUser.id,
          type: BalanceAccountType.TARGETOLOG_MAIN,
        },
      },
      update: {
        amount: new Prisma.Decimal('250000'),
      },
      create: {
        userId: targetUser.id,
        type: BalanceAccountType.TARGETOLOG_MAIN,
        amount: new Prisma.Decimal('250000'),
      },
    });

    const operatorMainAccount = await this.prisma.balanceAccount.upsert({
      where: {
        userId_type: {
          userId: operatorUser.id,
          type: BalanceAccountType.OPERATOR_MAIN,
        },
      },
      update: {
        amount: new Prisma.Decimal('80000'),
      },
      create: {
        userId: operatorUser.id,
        type: BalanceAccountType.OPERATOR_MAIN,
        amount: new Prisma.Decimal('80000'),
      },
    });

    const sellerMainAccount = await this.prisma.balanceAccount.upsert({
      where: {
        userId_type: {
          userId: sellerUser.id,
          type: BalanceAccountType.SELLER_MAIN,
        },
      },
      update: {
        amount: new Prisma.Decimal('420000'),
      },
      create: {
        userId: sellerUser.id,
        type: BalanceAccountType.SELLER_MAIN,
        amount: new Prisma.Decimal('420000'),
      },
    });

    await this.prisma.balanceTransaction.create({
      data: {
        accountId: targetMainAccount.id,
        userId: targetUser.id,
        type: BalanceTransactionType.LEAD_SOLD,
        amount: new Prisma.Decimal('150000'),
        balanceBefore: new Prisma.Decimal('100000'),
        balanceAfter: new Prisma.Decimal('250000'),
        isCredit: true,
        note: 'Demo lead sotildi.',
        metadata: {
          demo: true,
        },
        leadId: lead.id,
      },
    });

    await this.prisma.balanceTransaction.create({
      data: {
        accountId: operatorMainAccount.id,
        userId: operatorUser.id,
        type: BalanceTransactionType.LEAD_SOLD,
        amount: new Prisma.Decimal('80000'),
        balanceBefore: new Prisma.Decimal('0'),
        balanceAfter: new Prisma.Decimal('80000'),
        isCredit: true,
        note: 'Demo operator mukofoti.',
        metadata: {
          demo: true,
        },
        leadId: lead.id,
      },
    });

    await this.prisma.balanceTransaction.create({
      data: {
        accountId: sellerMainAccount.id,
        userId: sellerUser.id,
        type: BalanceTransactionType.LEAD_SOLD,
        amount: new Prisma.Decimal('420000'),
        balanceBefore: new Prisma.Decimal('0'),
        balanceAfter: new Prisma.Decimal('420000'),
        isCredit: true,
        note: 'Demo sotuvchi daromadi.',
        metadata: {
          demo: true,
        },
        leadId: lead.id,
      },
    });

    await this.prisma.payout.create({
      data: {
        userId: targetUser.id,
        amount: new Prisma.Decimal('200000'),
        status: PayoutStatus.PENDING,
        cardNumber: '8600123412341234',
        cardHolder: 'DEMO TARGETOLOG',
        comment: 'Demo payout so‘rovi',
      },
    });

    await this.prisma.balanceFraudCheck.create({
      data: {
        userId: targetUser.id,
        status: FraudCheckStatus.REVIEWING,
        reason: 'Demo fraud kuzatuvi',
        metadata: {
          score: 35,
          note: 'Demo ma’lumot',
        },
      },
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
