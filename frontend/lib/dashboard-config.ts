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

const NAV_COMMON: Record<string, DashboardNavGroup[]> = {
  admin: [
    {
      id: "dashboard",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Umumiy ko‘rinish", href: "/dashboard/admin" },
        { label: "Statistika", href: "/dashboard/admin#statistika" },
        { label: "So‘nggi faoliyat", href: "/dashboard/admin#faoliyat" },
      ],
    },
    {
      id: "users",
      title: "Foydalanuvchilar",
      icon: "users",
      items: [
        { label: "Targetologlar", href: "/dashboard/admin/users/targetologlar" },
        { label: "Sotuvchilar", href: "/dashboard/admin/users/sotuvchilar" },
        { label: "Asosiy sotuvchilar", href: "/dashboard/admin/users/asosiy-sotuvchilar" },
        { label: "Operatorlar", href: "/dashboard/admin/users/operatorlar" },
        { label: "Adminlar", href: "/dashboard/admin/users/adminlar" },
      ],
    },
    {
      id: "products",
      title: "Mahsulotlar",
      icon: "package",
      items: [
        { label: "Mahsulotlar ro‘yxati", href: "/dashboard/admin/mahsulotlar" },
        { label: "Yangi mahsulot qo‘shish", href: "/dashboard/admin/mahsulotlar/yangi" },
        { label: "Kategoriyalar", href: "/dashboard/admin/mahsulotlar/kategoriyalar" },
      ],
    },
    {
      id: "orders",
      title: "Buyurtmalar",
      icon: "cart",
      items: [
        { label: "Buyurtmalar paneli", href: "/dashboard/admin/buyurtmalar" },
        { label: "Status bo‘yicha nazorat", href: "/dashboard/admin/buyurtmalar/status" },
        { label: "Operator nazorati", href: "/dashboard/admin/buyurtmalar/operatorlar" },
      ],
    },
    {
      id: "warehouse",
      title: "Ombor / Sklad",
      icon: "warehouse",
      items: [
        { label: "Ombor paneli", href: "/dashboard/admin/ombor" },
        { label: "Yetkazib berish", href: "/dashboard/admin/ombor/yetkazib-berish" },
        { label: "Inventar hisobotlari", href: "/dashboard/admin/ombor/hisobotlar" },
      ],
    },
    {
      id: "payments",
      title: "To‘lovlar",
      icon: "money",
      items: [
        { label: "Balanslar", href: "/dashboard/admin/tolovlar" },
        { label: "Payout so‘rovlari", href: "/dashboard/admin/tolovlar/payout" },
        { label: "To‘lov tarixi", href: "/dashboard/admin/tolovlar/tarix" },
        { label: "Komissiyalar", href: "/dashboard/admin/tolovlar/komissiyalar" },
      ],
    },
    {
      id: "reports",
      title: "Statistika va hisobotlar",
      icon: "chart",
      items: [
        { label: "Umumiy hisobotlar", href: "/dashboard/admin/hisobotlar" },
        { label: "Rol va bo‘limlar", href: "/dashboard/admin/hisobotlar/rollar" },
        { label: "Grafika va diagrammalar", href: "/dashboard/admin/hisobotlar/grafiklar" },
      ],
    },
    {
      id: "notifications",
      title: "Bildirishnomalar",
      icon: "bell",
      items: [
        { label: "Xabarlar oqimi", href: "/dashboard/admin/bildirishnomalar" },
        { label: "Operator xabarlari", href: "/dashboard/admin/bildirishnomalar/operatorlar" },
        { label: "Targetolog xabarlari", href: "/dashboard/admin/bildirishnomalar/targetologlar" },
      ],
    },
    {
      id: "settings",
      title: "Sozlamalar",
      icon: "shield",
      items: [
        { label: "Umumiy sozlamalar", href: "/dashboard/admin/sozlamalar" },
        { label: "Integratsiyalar", href: "/dashboard/admin/sozlamalar/integratsiyalar" },
        { label: "Xavfsizlik va CAPTCHA", href: "/dashboard/admin/sozlamalar/xavfsizlik" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [
        { label: "Mening profilim", href: "/dashboard/admin/profil" },
        { label: "Sessiyalar va kirishlar", href: "/dashboard/admin/profil/sessiyalar" },
      ],
    },
  ],
  "super-admin": [
    {
      id: "dashboard",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Umumiy ko‘rsatkichlar", href: "/dashboard/super-admin" },
        { label: "Bildirishnomalar", href: "/dashboard/super-admin#bildirishnomalar" },
      ],
    },
    {
      id: "users",
      title: "Foydalanuvchilar",
      icon: "users",
      items: [
        { label: "Targetologlar", href: "/dashboard/super-admin/users/targetologlar" },
        { label: "Sotuvchilar", href: "/dashboard/super-admin/users/sotuvchilar" },
        { label: "Operatorlar", href: "/dashboard/super-admin/users/operatorlar" },
        { label: "Adminlar", href: "/dashboard/super-admin/users/adminlar" },
      ],
    },
    {
      id: "roles",
      title: "Rollar va ruxsatlar",
      icon: "clipboard",
      items: [
        { label: "Rollarni boshqarish", href: "/dashboard/super-admin/rollar" },
        { label: "Ruxsatlarni ko‘rish", href: "/dashboard/super-admin/rollar/ruxsatlar" },
      ],
    },
    {
      id: "reports",
      title: "Hisobotlar",
      icon: "chart",
      items: [
        { label: "Umumiy hisobotlar", href: "/dashboard/super-admin/hisobotlar" },
        { label: "Targetolog faoliyati", href: "/dashboard/super-admin/hisobotlar/targetologlar" },
        { label: "Sotuvchi faoliyati", href: "/dashboard/super-admin/hisobotlar/sotuvchilar" },
      ],
    },
    {
      id: "notifications",
      title: "Bildirishnomalar",
      icon: "bell",
      items: [
        { label: "Tizim ogohlantirishlari", href: "/dashboard/super-admin/bildirishnomalar" },
        { label: "Foydalanuvchi xabarlari", href: "/dashboard/super-admin/bildirishnomalar/foydalanuvchi" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [
        { label: "Shaxsiy ma’lumotlar", href: "/dashboard/super-admin/profil" },
        { label: "Xavfsizlik sozlamalari", href: "/dashboard/super-admin/profil/xavfsizlik" },
      ],
    },
  ],
  "oper-admin": [
    {
      id: "dashboard",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Operatorlar faoliyati", href: "/dashboard/oper-admin" },
        { label: "Bildirishnomalar", href: "/dashboard/oper-admin#bildirishnomalar" },
      ],
    },
    {
      id: "operators",
      title: "Operatorlar",
      icon: "user-check",
      items: [
        { label: "Operatorlar ro‘yxati", href: "/dashboard/oper-admin/operators" },
        { label: "Operator yaratish", href: "/dashboard/oper-admin/operators/yangi" },
        { label: "Bloklash / faollashtirish", href: "/dashboard/oper-admin/operators/holat" },
      ],
    },
    {
      id: "orders",
      title: "Buyurtmalar",
      icon: "cart",
      items: [
        { label: "Operatorlarga tayinlash", href: "/dashboard/oper-admin/buyurtmalar" },
        { label: "Yetkazilmoqda", href: "/dashboard/oper-admin/buyurtmalar/yetkazilmoqda" },
        { label: "Qaytarilgan", href: "/dashboard/oper-admin/buyurtmalar/qaytarilgan" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "shield",
      items: [
        { label: "Shaxsiy ma’lumotlar", href: "/dashboard/oper-admin/profil" },
      ],
    },
  ],
  "target-admin": [
    {
      id: "dashboard",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Targetologlar statisitkasi", href: "/dashboard/target-admin" },
        { label: "Reytinglar", href: "/dashboard/target-admin#reyting" },
      ],
    },
    {
      id: "targetologists",
      title: "Targetologlar",
      icon: "target",
      items: [
        { label: "Targetologlar ro‘yxati", href: "/dashboard/target-admin/targetologlar" },
        { label: "Targetolog qo‘shish", href: "/dashboard/target-admin/targetologlar/yangi" },
        { label: "Bloklash / faollashtirish", href: "/dashboard/target-admin/targetologlar/holat" },
      ],
    },
    {
      id: "notifications",
      title: "Bildirishnomalar",
      icon: "bell",
      items: [
        { label: "Targetologlarga xabar", href: "/dashboard/target-admin/bildirishnomalar" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [
        { label: "Shaxsiy ma’lumotlar", href: "/dashboard/target-admin/profil" },
      ],
    },
  ],
  "seller-admin": [
    {
      id: "dashboard",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Sotuvchilar statistikasi", href: "/dashboard/seller-admin" },
        { label: "Top sotuvchilar", href: "/dashboard/seller-admin#reyting" },
      ],
    },
    {
      id: "sellers",
      title: "Sotuvchilar",
      icon: "users",
      items: [
        { label: "Sotuvchilar ro‘yxati", href: "/dashboard/seller-admin/sotuvchilar" },
        { label: "Sotuvchi qo‘shish", href: "/dashboard/seller-admin/sotuvchilar/yangi" },
        { label: "Bloklash / faollashtirish", href: "/dashboard/seller-admin/sotuvchilar/holat" },
      ],
    },
    {
      id: "mentors",
      title: "Asosiy sotuvchilar",
      icon: "clipboard",
      items: [
        { label: "Asosiy sotuvchilar", href: "/dashboard/seller-admin/asosiy-sotuvchilar" },
        { label: "Qo‘llab-quvvatlash vazifalari", href: "/dashboard/seller-admin/asosiy-sotuvchilar/vazifalar" },
      ],
    },
    {
      id: "notifications",
      title: "Bildirishnomalar",
      icon: "bell",
      items: [
        { label: "Sotuvchilarga xabar", href: "/dashboard/seller-admin/bildirishnomalar" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [
        { label: "Shaxsiy ma’lumotlar", href: "/dashboard/seller-admin/profil" },
      ],
    },
  ],
  "sklad-admin": [
    {
      id: "dashboard",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Qabul qilingan buyurtmalar", href: "/dashboard/sklad-admin" },
        { label: "Bildirishnomalar", href: "/dashboard/sklad-admin#bildirishnomalar" },
      ],
    },
    {
      id: "orders",
      title: "Buyurtmalar",
      icon: "cart",
      items: [
        { label: "Qabul qilingan buyurtmalar", href: "/dashboard/sklad-admin/buyurtmalar/qabul-qilingan" },
        { label: "Yetkazilmoqda", href: "/dashboard/sklad-admin/buyurtmalar/yetkazilmoqda" },
        { label: "Muammoli buyurtmalar", href: "/dashboard/sklad-admin/buyurtmalar/muammolar" },
      ],
    },
    {
      id: "warehouse",
      title: "Ombor / Sklad",
      icon: "warehouse",
      items: [
        { label: "Ombor mahsulotlari", href: "/dashboard/sklad-admin/ombor" },
        { label: "Zaxira balanslari", href: "/dashboard/sklad-admin/ombor/zaxira" },
        { label: "Yetkazib berish hisobotlari", href: "/dashboard/sklad-admin/ombor/hisobotlar" },
      ],
    },
    {
      id: "notifications",
      title: "Bildirishnomalar",
      icon: "bell",
      items: [
        { label: "Yetkazib berish ogohlantirishlari", href: "/dashboard/sklad-admin/bildirishnomalar" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [
        { label: "Shaxsiy ma’lumotlar", href: "/dashboard/sklad-admin/profil" },
      ],
    },
  ],
  targetolog: [
    {
      id: "dashboard",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Umumiy ko‘rsatkichlar", href: "/dashboard/targetolog" },
        { label: "Reyting va hisobotlar", href: "/dashboard/targetolog#hisobot" },
      ],
    },
    {
      id: "products",
      title: "Mahsulotlar",
      icon: "package",
      items: [
        { label: "Mahsulotlar katalogi", href: "/dashboard/targetolog/mahsulotlar" },
        { label: "Affiliate havolalar", href: "/dashboard/targetolog/mahsulotlar/havolalar" },
      ],
    },
    {
      id: "finance",
      title: "Balans va to‘lovlar",
      icon: "money",
      items: [
        { label: "Balansim", href: "/dashboard/targetolog/balans" },
        { label: "Payout so‘rovi yuborish", href: "/dashboard/targetolog/payout" },
        { label: "To‘lov tarixi", href: "/dashboard/targetolog/tolovlar" },
      ],
    },
    {
      id: "notifications",
      title: "Bildirishnomalar",
      icon: "bell",
      items: [
        { label: "Target Admin xabarlari", href: "/dashboard/targetolog/bildirishnomalar" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [
        { label: "Shaxsiy ma’lumotlar", href: "/dashboard/targetolog/profil" },
      ],
    },
  ],
  sotuvchi: [
    {
      id: "dashboard",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Sotuv va buyurtma statistikasi", href: "/dashboard/sotuvchi" },
        { label: "Tezkor ko‘rsatkichlar", href: "/dashboard/sotuvchi#tezkor" },
      ],
    },
    {
      id: "orders",
      title: "Buyurtmalar",
      icon: "cart",
      items: [
        { label: "Mening buyurtmalarim", href: "/dashboard/sotuvchi/buyurtmalar" },
        { label: "Status monitoringi", href: "/dashboard/sotuvchi/buyurtmalar/status" },
      ],
    },
    {
      id: "finance",
      title: "Balans va to‘lovlar",
      icon: "money",
      items: [
        { label: "Balansim", href: "/dashboard/sotuvchi/balans" },
        { label: "Payout so‘rovi", href: "/dashboard/sotuvchi/payout" },
        { label: "To‘lov tarixi", href: "/dashboard/sotuvchi/tolovlar" },
      ],
    },
    {
      id: "products",
      title: "Mahsulotlar",
      icon: "package",
      items: [
        { label: "Mening mahsulotlarim", href: "/dashboard/sotuvchi/mahsulotlar" },
        { label: "Mahsulot qo‘shish", href: "/dashboard/sotuvchi/mahsulotlar/yangi" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [
        { label: "Shaxsiy ma’lumotlar", href: "/dashboard/sotuvchi/profil" },
      ],
    },
  ],
  operator: [
    {
      id: "dashboard",
      title: "Bosh sahifa",
      icon: "home",
      items: [
        { label: "Mening buyurtmalarim", href: "/dashboard/operator" },
        { label: "Yangi buyurtmalar", href: "/dashboard/operator#yangi" },
      ],
    },
    {
      id: "orders",
      title: "Buyurtmalar",
      icon: "cart",
      items: [
        { label: "Status monitoringi", href: "/dashboard/operator/buyurtmalar/status" },
        { label: "Qayta aloqa", href: "/dashboard/operator/buyurtmalar/qayta-aloqa" },
      ],
    },
    {
      id: "profile",
      title: "Profil",
      icon: "user-check",
      items: [
        { label: "Shaxsiy ma’lumotlar", href: "/dashboard/operator/profil" },
      ],
    },
  ],
};

export const DASHBOARD_CONFIG: Record<string, DashboardRoleConfig> = {
  admin: {
    slug: "admin",
    label: "Admin",
    title: "Admin boshqaruv paneli",
    description:
      "CPAMaRKeT.Uz tizimining barcha jarayonlarini boshqarish va monitoring qilish.",
    nav: NAV_COMMON.admin,
  },
  "super-admin": {
    slug: "super-admin",
    label: "Super Admin",
    title: "Super Admin paneli",
    description: "Foydalanuvchilar va tizim hisobotlarini kuzatish.",
    nav: NAV_COMMON["super-admin"],
  },
  "oper-admin": {
    slug: "oper-admin",
    label: "Oper Admin",
    title: "Operatsion boshqaruv paneli",
    description:
      "Operatorlar ishini va buyurtmalar jarayonini nazorat qiling.",
    nav: NAV_COMMON["oper-admin"],
  },
  "target-admin": {
    slug: "target-admin",
    label: "Target Admin",
    title: "Targetologlar paneli",
    description: "Targetologlar va ularning leadlari ustidan nazorat qiling.",
    nav: NAV_COMMON["target-admin"],
  },
  "seller-admin": {
    slug: "seller-admin",
    label: "Seller Admin",
    title: "Sotuvchilar boshqaruvi",
    description: "Sotuvchilar va ularning natijalarini nazorat qiling.",
    nav: NAV_COMMON["seller-admin"],
  },
  "sklad-admin": {
    slug: "sklad-admin",
    label: "Sklad Admin",
    title: "Ombor va logistika paneli",
    description: "Operatorlar qabul qilgan buyurtmalarni yetkazib berish.",
    nav: NAV_COMMON["sklad-admin"],
  },
  targetolog: {
    slug: "targetolog",
    label: "Targetolog",
    title: "Targetologlar uchun panel",
    description: "Shaxsiy leadlar, statistika va to‘lovlarni kuzatish.",
    nav: NAV_COMMON.targetolog,
  },
  sotuvchi: {
    slug: "sotuvchi",
    label: "Sotuvchi",
    title: "Sotuvchilar uchun boshqaruv paneli",
    description: "Mahsulotlar, buyurtmalar va balansni boshqaring.",
    nav: NAV_COMMON.sotuvchi,
  },
  operator: {
    slug: "operator",
    label: "Operator",
    title: "Operator boshqaruv paneli",
    description: "Biriktirilgan buyurtmalarni ko‘rib chiqing va yangilang.",
    nav: NAV_COMMON.operator,
  },
};

export const SUPPORTED_DASHBOARD_ROLES = Object.keys(DASHBOARD_CONFIG);

export function getDashboardConfig(role: string): DashboardRoleConfig | undefined {
  const normalized = role.toLowerCase();
  return DASHBOARD_CONFIG[normalized];
}
