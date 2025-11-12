import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

type TrendPoint = {
  label: string;
  value: number;
};

const MONTH_LABELS = [
  'Yan',
  'Fev',
  'Mar',
  'Apr',
  'May',
  'Iyun',
  'Iyul',
  'Avg',
  'Sen',
  'Okt',
  'Noy',
  'Dek',
];

const WEEK_LABELS = ['Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha', 'Yak'];

const ROLE_DEFAULTS: Record<
  string,
  {
    metrics: { label: string; value: string; change?: string }[];
    leadTrend: TrendPoint[];
    salesTrend: TrendPoint[];
    activeTrend: TrendPoint[];
  }
> = {
  ADMIN: {
    metrics: [
      { label: 'Faol foydalanuvchilar', value: '1 284', change: '+8.6%' },
      { label: 'Bugungi buyurtmalar', value: '342', change: '+4.2%' },
      { label: 'Yangi bildirishnomalar', value: '27', change: '+5' },
    ],
    leadTrend: MONTH_LABELS.map((label, index) => ({
      label,
      value: 400 + index * 32,
    })),
    salesTrend: MONTH_LABELS.map((label, index) => ({
      label,
      value: 320 + index * 28,
    })),
    activeTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 80 + index * 6,
    })),
  },
  SUPER_ADMIN: {
    metrics: [
      { label: 'Kuzatishdagi foydalanuvchilar', value: '842', change: '+6.4%' },
      { label: 'Hisobotlar', value: '58', change: '+3.1%' },
      { label: 'Audit yozuvlari', value: '143', change: '+2' },
    ],
    leadTrend: MONTH_LABELS.map((label, index) => ({
      label,
      value: 280 + index * 18,
    })),
    salesTrend: MONTH_LABELS.map((label, index) => ({
      label,
      value: 240 + index * 16,
    })),
    activeTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 62 + index * 4,
    })),
  },
  OPER_ADMIN: {
    metrics: [
      { label: 'Faol operatorlar', value: '48', change: '+7.2%' },
      { label: 'Yakunlangan buyurtmalar', value: '478', change: '+4.1%' },
      { label: 'Kutayotgan buyurtmalar', value: '54', change: '-2.8%' },
    ],
    leadTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 60 + index * 5,
    })),
    salesTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 48 + index * 6,
    })),
    activeTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 42 + index * 3,
    })),
  },
  TARGET_ADMIN: {
    metrics: [
      { label: 'Faol targetologlar', value: '126', change: '+6.0%' },
      { label: 'Bugungi lidlar', value: '892', change: '+6.4%' },
      { label: 'Sifatli lidlar', value: '746', change: '+4.9%' },
    ],
    leadTrend: MONTH_LABELS.map((label, index) => ({
      label,
      value: 320 + index * 30,
    })),
    salesTrend: MONTH_LABELS.map((label, index) => ({
      label,
      value: 220 + index * 18,
    })),
    activeTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 55 + index * 4,
    })),
  },
  SELLER_ADMIN: {
    metrics: [
      { label: 'Faol sotuvchilar', value: '64', change: '+5.3%' },
      { label: 'Kunlik savdo', value: '248 ta', change: '+7.1%' },
      { label: 'O‘rtacha chek', value: '420 000 so‘m' },
    ],
    leadTrend: MONTH_LABELS.map((label, index) => ({
      label,
      value: 180 + index * 12,
    })),
    salesTrend: MONTH_LABELS.map((label, index) => ({
      label,
      value: 260 + index * 14,
    })),
    activeTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 68 + index * 4,
    })),
  },
  SKLAD_ADMIN: {
    metrics: [
      { label: 'Ombordagi mahsulotlar', value: '18 240 dona' },
      { label: 'Bugungi jo‘natishlar', value: '164 ta', change: '+3.1%' },
      { label: 'Qaytarilgan buyurtmalar', value: '6 ta', change: '-1.4%' },
    ],
    leadTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 44 + index * 3,
    })),
    salesTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 52 + index * 5,
    })),
    activeTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 33 + index * 2,
    })),
  },
  TARGETOLOG: {
    metrics: [
      { label: 'Bugungi lidlar', value: '32 ta', change: '+5 ta' },
      { label: 'Konversiya darajasi', value: '7.8%', change: '+0.9%' },
      { label: 'Oylik to‘lov', value: '8 450 000 so‘m' },
    ],
    leadTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 28 + index * 3,
    })),
    salesTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 21 + index * 4,
    })),
    activeTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 18 + index * 2,
    })),
  },
  OPERATOR: {
    metrics: [
      { label: 'Bugungi buyurtmalar', value: '68 ta', change: '+6 ta' },
      { label: 'Yakunlangan buyurtmalar', value: '52 ta', change: '+3 ta' },
      { label: 'Qayta aloqa', value: '8 ta', change: '-2 ta' },
    ],
    leadTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 24 + index * 2,
    })),
    salesTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 18 + index * 3,
    })),
    activeTrend: WEEK_LABELS.map((label, index) => ({
      label,
      value: 14 + index * 2,
    })),
  },
};

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLandingStats() {
    const totalUsers = await this.prisma.user.count();
    const baseUsers = totalUsers || 1284;

    return {
      counts: {
        users: baseUsers,
        leads: baseUsers * 12,
        sales: Math.round(baseUsers * 7.8),
        topTargetologs: Math.max(12, Math.round(baseUsers / 60)),
      },
      testimonials: [
        {
          name: 'Gulnora X.',
          role: 'Super Admin',
          message:
            'CPAMaRKeT.Uz orqali biz targetologlar va sotuvchilar ishini yagona joyda nazorat qilib, jarayonlarni tezlashtirdik.',
        },
        {
          name: 'Murodjon A.',
          role: 'Targetolog',
          message:
            'Leaddar statistikasi va tezkor to‘lovlar uchun eng qulay platforma. Yangi kampaniyalarni bir necha daqiqada ishga tushiraman.',
        },
        {
          name: 'Sabina R.',
          role: 'Operator',
          message:
            'Buyurtmalar bilan ishlash juda osonlashdi. Har bir mijozning holatini ko‘rib, tezkor aloqa o‘rnataman.',
        },
      ],
    };
  }

  async getDashboardStats(roleSlug: string) {
    const normalized = roleSlug.toUpperCase();
    const defaults = ROLE_DEFAULTS[normalized] ?? ROLE_DEFAULTS.ADMIN;

    const usersCount = await this.prisma.user.count();

    return {
      role: normalized,
      metrics: defaults.metrics,
      charts: {
        leads: defaults.leadTrend,
        sales: defaults.salesTrend,
        active: defaults.activeTrend,
      },
      summary: {
        users: usersCount,
        leads: defaults.leadTrend.reduce((sum, point) => sum + point.value, 0),
        sales: defaults.salesTrend.reduce((sum, point) => sum + point.value, 0),
      },
    };
  }
}
