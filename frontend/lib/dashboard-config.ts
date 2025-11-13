export type DashboardIconKey =
  | "home"
  | "users"
  | "cart"
  | "chart"
  | "bell"
  | "package"
  | "target"
  | "user-check"
  | "clipboard"
  | "shield"
  | "money"
  | "warehouse";

export type DashboardNavGroup = {
  id: string;
  title: string;
  icon: DashboardIconKey;
  items: {
    label: string;
    href: string;
  }[];
};

export type DashboardRoleConfig = {
  slug: string;
  label: string;
  title: string;
  description: string;
  nav: DashboardNavGroup[];
};

const NAV_CONFIG: Record<string, DashboardNavGroup[]> = {
  "super-admin": [
    {
      id: "overview",
      title: "Platforma",
      icon: "home",
      items: [
        { label: "Umumiy ko‘rsatkichlar", href: "/dashboard/super-admin" },
        { label: "Faollik loglari", href: "/dashboard/super-admin#faoliyat" },
      ],
    },
    {
      id: "users",
      title: "Foydalanuvchilar",
      icon: "users",
      items: [
        { label: "Foydalanuvchilar ro‘yxati", href: "/dashboard/super-admin/foydalanuvchilar" },
        { label: "Rollar va ruxsatlar", href: "/dashboard/super-admin/rollar" },
      ],
    },
    {
      id: "balances",
      title: "Balans & Fraud",
      icon: "money",
      items: [
        { label: "Balans nazorati", href: "/dashboard/super-admin/balans" },
        { label: "Fraud tekshiruvlari", href: "/dashboard/super-admin/fraud" },
        { label: "Payout so‘rovlari", href: "/dashboard/super-admin/tolovlar" },
      ],
    },
    {
      id: "settings",
      title: "Sozlamalar",
      icon: "shield",
      items: [
        { label: "Tizim sozlamalari", href: "/dashboard/super-admin/sozlamalar" },
        { label: "Integratsiyalar", href: "/dashboard/super-admin/sozlamalar/integratsiya" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [
        { label: "Shaxsiy ma’lumotlar", href: "/dashboard/super-admin/profil" },
        { label: "Xavfsizlik", href: "/dashboard/super-admin/profil/xavfsizlik" },
      ],
    },
  ],
  admin: [
    {
      id: "overview",
      title: "Boshqaruv",
      icon: "home",
      items: [
        { label: "Umumiy ko‘rinish", href: "/dashboard/admin" },
        { label: "Bildirishnomalar", href: "/dashboard/admin#bildirishnomalar" },
      ],
    },
    {
      id: "teams",
      title: "Jamoalar",
      icon: "users",
      items: [
        { label: "Target jamoasi", href: "/dashboard/admin/target-jamoa" },
        { label: "Operator jamoasi", href: "/dashboard/admin/operator-jamoa" },
        { label: "Sklad boshqaruvi", href: "/dashboard/admin/sklad" },
      ],
    },
    {
      id: "products",
      title: "Mahsulot & oqimlar",
      icon: "package",
      items: [
        { label: "Mahsulotlar", href: "/dashboard/admin/mahsulotlar" },
        { label: "Oqim nazorati", href: "/dashboard/admin/oqimlar" },
      ],
    },
    {
      id: "finance",
      title: "Balans & to‘lovlar",
      icon: "money",
      items: [
        { label: "Balanslar", href: "/dashboard/admin/balans" },
        { label: "Payout so‘rovlari", href: "/dashboard/admin/payout" },
        { label: "Fraud ogohlantirishlari", href: "/dashboard/admin/fraud" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [{ label: "Shaxsiy ma’lumotlar", href: "/dashboard/admin/profil" }],
    },
  ],
  "target-admin": [
    {
      id: "overview",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Jamoa ko‘rsatkichlari", href: "/dashboard/target-admin" },
        { label: "Leadlar oqimi", href: "/dashboard/target-admin#leadlar" },
      ],
    },
    {
      id: "targetologists",
      title: "Targetologlar",
      icon: "target",
      items: [
        { label: "Targetologlar ro‘yxati", href: "/dashboard/target-admin/targetologlar" },
        { label: "Balans nazorati", href: "/dashboard/target-admin/balanslar" },
      ],
    },
    {
      id: "fraud",
      title: "Fraud va bloklash",
      icon: "shield",
      items: [
        { label: "Fraud leadlar", href: "/dashboard/target-admin/fraud" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [{ label: "Shaxsiy ma’lumotlar", href: "/dashboard/target-admin/profil" }],
    },
  ],
  "oper-admin": [
    {
      id: "overview",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Operator ko‘rsatkichlari", href: "/dashboard/oper-admin" },
        { label: "KPI monitoringi", href: "/dashboard/oper-admin#kpi" },
      ],
    },
    {
      id: "operators",
      title: "Operatorlar",
      icon: "users",
      items: [
        { label: "Operatorlar ro‘yxati", href: "/dashboard/oper-admin/operatorlar" },
        { label: "Grafik va navbatchilik", href: "/dashboard/oper-admin/grafik" },
      ],
    },
    {
      id: "orders",
      title: "Buyurtmalar",
      icon: "cart",
      items: [
        { label: "Buyurtmalar paneli", href: "/dashboard/oper-admin/buyurtmalar" },
        { label: "Qayta aloqa", href: "/dashboard/oper-admin/buyurtmalar/qayta-aloqa" },
      ],
    },
    {
      id: "calls",
      title: "Qo‘ng‘iroqlar",
      icon: "bell",
      items: [
        { label: "Call loglari", href: "/dashboard/oper-admin/calls" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [{ label: "Shaxsiy ma’lumotlar", href: "/dashboard/oper-admin/profil" }],
    },
  ],
  "sklad-admin": [
    {
      id: "overview",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Logistika paneli", href: "/dashboard/sklad-admin" },
        { label: "Bildirishnomalar", href: "/dashboard/sklad-admin#bildirishnomalar" },
      ],
    },
    {
      id: "orders",
      title: "Buyurtmalar",
      icon: "cart",
      items: [
        { label: "Qadoqlash navbatchiligi", href: "/dashboard/sklad-admin/buyurtmalar/qadoqlash" },
        { label: "Yo‘lda", href: "/dashboard/sklad-admin/buyurtmalar/yolda" },
        { label: "Qaytganlar", href: "/dashboard/sklad-admin/buyurtmalar/qaytgan" },
      ],
    },
    {
      id: "warehouse",
      title: "Ombor",
      icon: "warehouse",
      items: [
        { label: "Mahsulot qoldig‘i", href: "/dashboard/sklad-admin/ombor" },
        { label: "Ta’minot loglari", href: "/dashboard/sklad-admin/ombor/loglar" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [{ label: "Shaxsiy ma’lumotlar", href: "/dashboard/sklad-admin/profil" }],
    },
  ],
  taminotchi: [
    {
      id: "overview",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Mahsulot ko‘rsatkichlari", href: "/dashboard/taminotchi" },
        { label: "Loglar", href: "/dashboard/taminotchi#loglar" },
      ],
    },
    {
      id: "products",
      title: "Mahsulotlarim",
      icon: "package",
      items: [
        { label: "Mahsulot ro‘yxati", href: "/dashboard/taminotchi/mahsulotlar" },
        { label: "Yangi mahsulot qo‘shish", href: "/dashboard/taminotchi/mahsulotlar/yangi" },
      ],
    },
    {
      id: "orders",
      title: "Buyurtmalar",
      icon: "cart",
      items: [
        { label: "Aktiv buyurtmalar", href: "/dashboard/taminotchi/buyurtmalar" },
        { label: "Arxiv", href: "/dashboard/taminotchi/buyurtmalar/arxiv" },
      ],
    },
    {
      id: "finance",
      title: "Balans & to‘lovlar",
      icon: "money",
      items: [
        { label: "Balansim", href: "/dashboard/taminotchi/payout" },
        { label: "To‘lov tarixi", href: "/dashboard/taminotchi/tolovlar" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [{ label: "Shaxsiy ma’lumotlar", href: "/dashboard/taminotchi/profil" }],
    },
  ],
  operator: [
    {
      id: "overview",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Bugungi vazifalar", href: "/dashboard/operator" },
        { label: "Bildirishnomalar", href: "/dashboard/operator#bildirishnomalar" },
      ],
    },
    {
      id: "leads",
      title: "Leadlar",
      icon: "target",
      items: [
        { label: "Yangi leadlar", href: "/dashboard/operator/leadlar/yangi" },
        { label: "Qabul qilingan leadlar", href: "/dashboard/operator/leadlar/qabul" },
      ],
    },
    {
      id: "orders",
      title: "Buyurtmalar",
      icon: "cart",
      items: [
        { label: "Buyurtmalar paneli", href: "/dashboard/operator/buyurtmalar" },
        { label: "Qayta aloqa", href: "/dashboard/operator/buyurtmalar/qayta-aloqa" },
      ],
    },
    {
      id: "finance",
      title: "Balans",
      icon: "money",
      items: [
        { label: "Balansim", href: "/dashboard/operator/payout" },
        { label: "To‘lov tarixi", href: "/dashboard/operator/tolovlar" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [{ label: "Shaxsiy ma’lumotlar", href: "/dashboard/operator/profil" }],
    },
  ],
  targetolog: [
    {
      id: "overview",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "KPI paneli", href: "/dashboard/targetolog" },
        { label: "Bildirishnomalar", href: "/dashboard/targetolog#bildirishnomalar" },
      ],
    },
    {
      id: "leads",
      title: "Leadlar",
      icon: "target",
      items: [
        { label: "Leadlarim", href: "/dashboard/targetolog/leadlar" },
        { label: "Yangi lead yaratish", href: "/dashboard/targetolog/leadlar/yangi" },
      ],
    },
    {
      id: "products",
      title: "Mahsulotlar",
      icon: "package",
      items: [
        { label: "Mahsulot katalogi", href: "/dashboard/targetolog/mahsulotlar" },
      ],
    },
    {
      id: "finance",
      title: "Balans & payout",
      icon: "money",
      items: [
        { label: "Balansim", href: "/dashboard/targetolog/payout" },
        { label: "To‘lov tarixi", href: "/dashboard/targetolog/tolovlar" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [{ label: "Shaxsiy ma’lumotlar", href: "/dashboard/targetolog/profil" }],
    },
  ],
};

export const DASHBOARD_CONFIG: Record<string, DashboardRoleConfig> = {
  "super-admin": {
    slug: "super-admin",
    label: "SuperAdmin",
    title: "SuperAdmin boshqaruv paneli",
    description:
      "Platforma darajasidagi barcha jarayonlarni boshqarish va kuzatish uchun markaz.",
    nav: NAV_CONFIG["super-admin"],
  },
  admin: {
    slug: "admin",
    label: "Admin",
    title: "Admin boshqaruv paneli",
    description:
      "Bo‘lim boshliqlari, mahsulotlar va moliyaviy jarayonlarni boshqarish uchun panel.",
    nav: NAV_CONFIG.admin,
  },
  "target-admin": {
    slug: "target-admin",
    label: "Target Admin",
    title: "Targetologlar boshqaruvi",
    description:
      "Targetologlar jamoasi, kampaniyalar va lead sifatini nazorat qilish.",
    nav: NAV_CONFIG["target-admin"],
  },
  "oper-admin": {
    slug: "oper-admin",
    label: "Oper Admin",
    title: "Operatorlar boshqaruvi",
    description:
      "Operatorlar samaradorligi, jadval va qo‘ng‘iroq jarayonlarini boshqarish.",
    nav: NAV_CONFIG["oper-admin"],
  },
  "sklad-admin": {
    slug: "sklad-admin",
    label: "Sklad Admin",
    title: "Sklad va logistika boshqaruvi",
    description:
      "Qadoqlash, yetkazib berish va qaytarish jarayonlarini rejalashtirish.",
    nav: NAV_CONFIG["sklad-admin"],
  },
  taminotchi: {
    slug: "taminotchi",
    label: "Ta’minotchi",
    title: "Ta’minotchi paneli",
    description:
      "Mahsulot ta’minoti, zaxiralar va o‘z buyurtmalarini nazorat qilish.",
    nav: NAV_CONFIG.taminotchi,
  },
  operator: {
    slug: "operator",
    label: "Operator",
    title: "Operator ishchi paneli",
    description:
      "Qo‘ng‘iroqlar, leadlar va buyurtmalar bilan ishlash uchun qulay interfeys.",
    nav: NAV_CONFIG.operator,
  },
  targetolog: {
    slug: "targetolog",
    label: "Targetolog",
    title: "Targetolog ishchi paneli",
    description:
      "Reklama oqimlari, leadlar va balansni boshqarish uchun qulay panel.",
    nav: NAV_CONFIG.targetolog,
  },
};

export function getDashboardConfig(role: string) {
  return DASHBOARD_CONFIG[role];
}

export const SUPPORTED_DASHBOARD_ROLES = Object.keys(DASHBOARD_CONFIG);
