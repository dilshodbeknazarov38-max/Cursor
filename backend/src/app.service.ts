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
    name: 'Super Admin',
    slug: 'SUPER_ADMIN',
    description: 'Platforma egasi, barcha modullar va xavfsizlikni boshqaradi.',
  },
  {
    name: 'Admin',
    slug: 'ADMIN',
    description: 'Platforma jarayonlarini va bo‘lim boshliqlarini boshqaradi.',
  },
  {
    name: 'Target Admin',
    slug: 'TARGET_ADMIN',
    description: 'Targetologlar va reklama oqimlarini nazorat qiladi.',
  },
  {
    name: 'Oper Admin',
    slug: 'OPER_ADMIN',
    description: 'Operatorlar jamoasini va qo‘ng‘iroqlarni boshqaradi.',
  },
  {
    name: 'Sklad Admin',
    slug: 'SKLAD_ADMIN',
    description: 'Ombor, qadoqlash va logistika jarayonlarini yuritadi.',
  },
  {
    name: 'Ta’minotchi',
    slug: 'TAMINOTCHI',
    description: 'Mahsulot ta’minoti va qoldiqlarini boshqaradi.',
  },
  {
    name: 'Operator',
    slug: 'OPERATOR',
    description: 'Mijozlar bilan qo‘ng‘iroqlarni amalga oshiradi va buyurtmalarni tasdiqlaydi.',
  },
  {
    name: 'Targetolog',
    slug: 'TARGETOLOG',
    description: 'Reklama oqimlari va leadlarni yuritadi.',
  },
];

const DEFAULT_PERMISSIONS = [
  { name: 'Platformani boshqarish', slug: 'MANAGE_PLATFORM' },
  { name: 'Foydalanuvchilarni boshqarish', slug: 'MANAGE_USERS' },
  { name: 'Rollarni boshqarish', slug: 'MANAGE_ROLES' },
  { name: 'Balanslarni boshqarish', slug: 'MANAGE_BALANCES' },
  { name: 'Fraud tizimini boshqarish', slug: 'MANAGE_FRAUD' },
  { name: 'Payoutlarni tasdiqlash', slug: 'APPROVE_PAYOUTS' },
  { name: 'Mahsulotlarni boshqarish', slug: 'MANAGE_PRODUCTS' },
  { name: 'Leadlarni boshqarish', slug: 'MANAGE_LEADS' },
  { name: 'Buyurtmalarni boshqarish', slug: 'MANAGE_ORDERS' },
  { name: 'Targetolog jamoasini boshqarish', slug: 'MANAGE_TARGET_TEAM' },
  { name: 'Operator jamoasini boshqarish', slug: 'MANAGE_OPERATOR_TEAM' },
  { name: 'Skladni boshqarish', slug: 'MANAGE_SKLAD' },
  { name: 'Ta’minot jarayonini boshqarish', slug: 'MANAGE_SUPPLY' },
  { name: 'Call loglarini ko‘rish', slug: 'VIEW_CALL_LOGS' },
  { name: 'Targetolog balanslarini ko‘rish', slug: 'VIEW_TARGET_BALANCES' },
  { name: 'Operator balanslarini ko‘rish', slug: 'VIEW_OPERATOR_BALANCES' },
  { name: 'Loglarni ko‘rish', slug: 'VIEW_ACTIVITY_LOGS' },
  { name: 'Leadlarni ko‘rish', slug: 'VIEW_LEADS' },
  { name: 'Buyurtma statusini yangilash', slug: 'UPDATE_ORDER_STATUS' },
  { name: 'O‘z mahsulotlarini boshqarish', slug: 'MANAGE_OWN_PRODUCTS' },
  { name: 'O‘z buyurtmalarini ko‘rish', slug: 'VIEW_OWN_ORDERS' },
  { name: 'Shaxsiy balansni ko‘rish', slug: 'VIEW_SELF_BALANCE' },
  { name: 'Payout so‘rovi yuborish', slug: 'REQUEST_PAYOUT' },
  { name: 'Lead yaratish', slug: 'CREATE_LEADS' },
  { name: 'Operator qo‘ng‘iroqlarini ko‘rish', slug: 'VIEW_OPERATOR_CALLS' },
  { name: 'Dashboardni ko‘rish', slug: 'VIEW_DASHBOARD' },
];

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  SUPER_ADMIN: DEFAULT_PERMISSIONS.map((permission) => permission.slug),
  ADMIN: [
    'MANAGE_USERS',
    'MANAGE_ROLES',
    'MANAGE_BALANCES',
    'MANAGE_FRAUD',
    'APPROVE_PAYOUTS',
    'MANAGE_PRODUCTS',
    'MANAGE_LEADS',
    'MANAGE_ORDERS',
    'MANAGE_TARGET_TEAM',
    'MANAGE_OPERATOR_TEAM',
    'MANAGE_SKLAD',
    'MANAGE_SUPPLY',
    'VIEW_ACTIVITY_LOGS',
    'VIEW_LEADS',
    'VIEW_DASHBOARD',
  ],
  TARGET_ADMIN: [
    'VIEW_DASHBOARD',
    'MANAGE_TARGET_TEAM',
    'MANAGE_LEADS',
    'VIEW_TARGET_BALANCES',
    'VIEW_LEADS',
  ],
  OPER_ADMIN: [
    'VIEW_DASHBOARD',
    'MANAGE_OPERATOR_TEAM',
    'MANAGE_ORDERS',
    'VIEW_OPERATOR_BALANCES',
    'VIEW_OPERATOR_CALLS',
    'UPDATE_ORDER_STATUS',
  ],
  SKLAD_ADMIN: [
    'VIEW_DASHBOARD',
    'MANAGE_SKLAD',
    'MANAGE_ORDERS',
    'UPDATE_ORDER_STATUS',
  ],
  TAMINOTCHI: [
    'VIEW_DASHBOARD',
    'MANAGE_SUPPLY',
    'MANAGE_OWN_PRODUCTS',
    'VIEW_OWN_ORDERS',
    'VIEW_SELF_BALANCE',
    'REQUEST_PAYOUT',
  ],
  OPERATOR: [
    'VIEW_DASHBOARD',
    'VIEW_LEADS',
    'UPDATE_ORDER_STATUS',
    'VIEW_OPERATOR_CALLS',
    'VIEW_SELF_BALANCE',
    'REQUEST_PAYOUT',
  ],
  TARGETOLOG: [
    'VIEW_DASHBOARD',
    'CREATE_LEADS',
    'VIEW_LEADS',
    'VIEW_SELF_BALANCE',
    'REQUEST_PAYOUT',
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
          in: ['TARGETOLOG', 'TAMINOTCHI', 'OPERATOR'],
        },
      },
    });
    const roleMap = new Map(roles.map((role) => [role.slug, role]));

    const targetRole = roleMap.get('TARGETOLOG');
    const supplierRole = roleMap.get('TAMINOTCHI');
    const operatorRole = roleMap.get('OPERATOR');

    if (!targetRole || !supplierRole || !operatorRole) {
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

    const supplierUser = await this.prisma.user.upsert({
      where: { phone: '+998900000002' },
      update: {
        passwordHash: demoPasswordHash,
        roleId: supplierRole.id,
        status: UserStatus.ACTIVE,
      },
      create: {
        firstName: 'Demo Ta’minotchi',
        nickname: 'demo_taminotchi',
        phone: '+998900000002',
        passwordHash: demoPasswordHash,
        status: UserStatus.ACTIVE,
        roleId: supplierRole.id,
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

    const existingProduct = await this.prisma.product.findFirst({
      where: {
        ownerId: supplierUser.id,
        title: 'Demo mahsulot',
      },
    });

    const product =
      existingProduct ??
      (await this.prisma.product.create({
        data: {
          title: 'Demo mahsulot',
          description: 'Demo mahsulotning to‘liq tavsifi.',
          price: new Prisma.Decimal('350000'),
          cpaTargetolog: new Prisma.Decimal('150000'),
          cpaOperator: new Prisma.Decimal('80000'),
          images: ['/static/placeholders/product.png'],
          stock: 100,
          status: ProductStatus.APPROVED,
          ownerId: supplierUser.id,
        },
      }));

    const flow = await this.prisma.flow.create({
      data: {
        title: 'Demo oqim',
        slug: `demo-${product.id.slice(0, 6)}`,
        url: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/products/${product.id}`,
        productId: product.id,
        ownerId: targetUser.id,
      },
    });

    const lead = await this.prisma.lead.create({
      data: {
        flowId: flow.id,
        productId: product.id,
        targetologId: targetUser.id,
        operatorId: operatorUser.id,
        phone: '+998901112233',
        name: 'Demo lead',
        status: LeadStatus.CONFIRMED,
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
          packedAt: new Date(),
          shippedAt: new Date(),
          deliveredAt: new Date(),
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

    const supplierMainAccount = await this.prisma.balanceAccount.upsert({
      where: {
        userId_type: {
          userId: supplierUser.id,
          type: BalanceAccountType.SELLER_MAIN,
        },
      },
      update: {
        amount: new Prisma.Decimal('420000'),
      },
      create: {
        userId: supplierUser.id,
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
        accountId: supplierMainAccount.id,
        userId: supplierUser.id,
        type: BalanceTransactionType.LEAD_SOLD,
        amount: new Prisma.Decimal('420000'),
        balanceBefore: new Prisma.Decimal('0'),
        balanceAfter: new Prisma.Decimal('420000'),
        isCredit: true,
        note: 'Demo ta’minotchi daromadi.',
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
