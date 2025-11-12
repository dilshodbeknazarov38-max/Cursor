export type DashboardIconKey =
  | "home"
  | "users"
  | "cart"
  | "chart"
  | "gauge"
  | "bell"
  | "package"
  | "target"
  | "user-check"
  | "clipboard"
  | "shield"
  | "money"
  | "warehouse";

export type DashboardMetric = {
  label: string;
  value: string;
  change?: string;
  tone?: "positive" | "negative" | "neutral";
};

export type DashboardSectionItem = {
  title: string;
  subtitle?: string;
  status?: string;
  statusTone?: "info" | "success" | "warning";
};

export type DashboardSection = {
  title: string;
  description?: string;
  items: DashboardSectionItem[];
};

export type DashboardNavGroup = {
  id: string;
  title: string;
  icon: DashboardIconKey;
  items: {
    label: string;
    href: string;
    badge?: string;
  }[];
};

export type DashboardRoleConfig = {
  slug: string;
  label: string;
  title: string;
  description: string;
  nav: DashboardNavGroup[];
  metrics: DashboardMetric[];
  sections: DashboardSection[];
};

export const DASHBOARD_CONFIG: Record<string, DashboardRoleConfig> = {
  admin: {
    slug: "admin",
    label: "Admin",
    title: "Admin boshqaruv paneli",
    description:
      "CPAMaRKeT.Uz tizimining barcha jarayonlarini boshqarish va monitoring qilish.",
    nav: [
      {
        id: "overview",
        title: "Umumiy",
        icon: "home",
        items: [
          { label: "Bosh sahifa", href: "#" },
          { label: "Tizim holati", href: "#" },
          { label: "Nazorat paneli", href: "#" },
        ],
      },
      {
        id: "users",
        title: "Foydalanuvchilar",
        icon: "users",
        items: [
          { label: "Foydalanuvchilar ro‘yxati", href: "#" },
          { label: "Rollar va ruxsatlar", href: "#" },
          { label: "Yangi foydalanuvchi", href: "#", badge: "Yangi" },
        ],
      },
      {
        id: "operations",
        title: "Operatsiyalar",
        icon: "cart",
        items: [
          { label: "Buyurtmalar", href: "#" },
          { label: "To‘lovlar", href: "#" },
          { label: "Bildirishnomalar", href: "#" },
        ],
      },
      {
        id: "reports",
        title: "Hisobotlar",
        icon: "chart",
        items: [
          { label: "Umumiy statistika", href: "#" },
          { label: "Moliyaviy hisobotlar", href: "#" },
          { label: "Audit jurnali", href: "#" },
        ],
      },
    ],
    metrics: [
      {
        label: "Faol foydalanuvchilar",
        value: "1 284",
        change: "+8.6%",
        tone: "positive",
      },
      {
        label: "Yangi buyurtmalar",
        value: "342",
        change: "+4.2%",
        tone: "positive",
      },
      {
        label: "To‘langan hisoblar",
        value: "198",
        change: "+3.4%",
        tone: "positive",
      },
      {
        label: "Bildirishnomalar",
        value: "27",
        change: "+5 yangi",
        tone: "neutral",
      },
    ],
    sections: [
      {
        title: "Tezkor amalga oshiriladigan vazifalar",
        description:
          "Bugun diqqat qaratilishi kerak bo‘lgan asosiy ma’muriy vazifalar.",
        items: [
          {
            title: "Yangi rol yaratish",
            subtitle: "Target Admin uchun ruxsatlarni sozlang",
            status: "Jarayonda",
            statusTone: "info",
          },
          {
            title: "Buyurtmalarni tasdiqlash",
            subtitle: "34 ta buyurtma tekshirilishi kerak",
            status: "Muhim",
            statusTone: "warning",
          },
          {
            title: "Bildirishnomalar shabloni",
            subtitle: "Operatorlar uchun yangilangan SMS matni",
            status: "Yakunlangan",
            statusTone: "success",
          },
        ],
      },
      {
        title: "So‘nggi faoliyat",
        items: [
          {
            title: "Super Admin hisobotni yuklab oldi",
            subtitle: "12:36 — Hisobotlar moduli",
          },
          {
            title: "Oper Admin yangi operator qo‘shdi",
            subtitle: "11:20 — Operatorlar bo‘limi",
          },
          {
            title: "Sklad Admin yetkazib berishni yakunladi",
            subtitle: "09:05 — Ombor moduli",
          },
        ],
      },
    ],
  },
  "super-admin": {
    slug: "super-admin",
    label: "Super Admin",
    title: "Super Admin paneli",
    description: "Foydalanuvchilar va tizim hisobotlarini kuzatish.",
    nav: [
      {
        id: "monitoring",
        title: "Monitoring",
        icon: "gauge",
        items: [
          { label: "Boshqaruv paneli", href: "#" },
          { label: "Faol foydalanuvchilar", href: "#" },
          { label: "Moliyaviy ko‘rsatkichlar", href: "#" },
        ],
      },
      {
        id: "reports",
        title: "Hisobotlar",
        icon: "chart",
        items: [
          { label: "Umumiy hisobot", href: "#" },
          { label: "Foydalanuvchi hisobotlari", href: "#" },
          { label: "Statistikalar", href: "#" },
        ],
      },
      {
        id: "alerts",
        title: "Ogohlantirishlar",
        icon: "bell",
        items: [
          { label: "Tizim ogohlantirishlari", href: "#" },
          { label: "Xavfsizlik eslatmalari", href: "#" },
        ],
      },
    ],
    metrics: [
      { label: "Faol foydalanuvchilar", value: "1 284" },
      { label: "Sessiya davomiyligi", value: "12 daqiqa" },
      { label: "Bugungi hisobotlar", value: "18 ta", change: "+2", tone: "positive" },
      { label: "Xavfsizlik ogohlantirishlari", value: "0 ta", tone: "neutral" },
    ],
    sections: [
      {
        title: "Monitoring bo‘limlari",
        items: [
          {
            title: "Foydalanuvchilar faolligi",
            subtitle: "So‘nggi 24 soat ichida 8.6% o‘sish",
            status: "Yaxshi",
            statusTone: "success",
          },
          {
            title: "Xizmat barqarorligi",
            subtitle: "API javob vaqti 230 ms",
            status: "Barqaror",
            statusTone: "info",
          },
        ],
      },
    ],
  },
  "oper-admin": {
    slug: "oper-admin",
    label: "Oper Admin",
    title: "Operatsion boshqaruv paneli",
    description:
      "Operatorlar ishini va buyurtmalar jarayonini nazorat qiling.",
    nav: [
      {
        id: "operators",
        title: "Operatorlar",
        icon: "user-check",
        items: [
          { label: "Operatorlar ro‘yxati", href: "#" },
          { label: "Vazifalar taqsimoti", href: "#" },
          { label: "Samaradorlik", href: "#" },
        ],
      },
      {
        id: "orders",
        title: "Buyurtmalar",
        icon: "cart",
        items: [
          { label: "Faol buyurtmalar", href: "#" },
          { label: "Kutayotgan buyurtmalar", href: "#" },
          { label: "Yetkazilgan buyurtmalar", href: "#" },
        ],
      },
      {
        id: "support",
        title: "Qo‘llab-quvvatlash",
        icon: "clipboard",
        items: [
          { label: "Operatorlar uchun yo‘riqnomalar", href: "#" },
          { label: "Tez-tez so‘raladigan savollar", href: "#" },
        ],
      },
    ],
    metrics: [
      { label: "Faol operatorlar", value: "48", change: "+3", tone: "positive" },
      { label: "Bugungi buyurtmalar", value: "612", change: "+5.2%", tone: "positive" },
      { label: "Yetkazilgan buyurtmalar", value: "478", change: "+4.1%", tone: "positive" },
      { label: "Qo‘llab-quvvatlash so‘rovlari", value: "19", tone: "neutral" },
    ],
    sections: [
      {
        title: "Ustuvor vazifalar",
        items: [
          {
            title: "Yangi operatorga trening",
            subtitle: "Dilshod R. uchun o‘qitish rejasini tasdiqlang",
            status: "Jarayonda",
            statusTone: "info",
          },
          {
            title: "Buyurtmalarni qayta taqsimlash",
            subtitle: "Yuklama balansini tekshiring",
            status: "Muhim",
            statusTone: "warning",
          },
        ],
      },
    ],
  },
  "target-admin": {
    slug: "target-admin",
    label: "Target Admin",
    title: "Targetologlar paneli",
    description:
      "Targetologlar va ularning lidlarini samarali boshqarish.",
    nav: [
      {
        id: "targetologists",
        title: "Targetologlar",
        icon: "target",
        items: [
          { label: "Targetologlar ro‘yxati", href: "#" },
          { label: "Faollik darajasi", href: "#" },
          { label: "Mukofotlash tizimi", href: "#" },
        ],
      },
      {
        id: "leads",
        title: "Lidlar",
        icon: "package",
        items: [
          { label: "Yangi lidlar", href: "#" },
          { label: "Sifat nazorati", href: "#" },
          { label: "Muvaffaqiyatli lidlar", href: "#" },
        ],
      },
      {
        id: "analytics",
        title: "Analitika",
        icon: "chart",
        items: [
          { label: "Kunlik hisobot", href: "#" },
          { label: "Reklama kanallari", href: "#" },
          { label: "Konversiya jadvallari", href: "#" },
        ],
      },
    ],
    metrics: [
      { label: "Faol targetologlar", value: "126" },
      { label: "Bugungi lidlar", value: "892", change: "+6.4%", tone: "positive" },
      { label: "Qabul qilingan lidlar", value: "746", change: "+4.9%", tone: "positive" },
      { label: "Rad etilgan lidlar", value: "36", change: "-1.2%", tone: "positive" },
    ],
    sections: [
      {
        title: "Ish jarayoni",
        items: [
          {
            title: "Yangi kampaniya tasdiqlash",
            subtitle: "Telegram trafik kampaniyasi",
            status: "Ko‘rib chiqilmoqda",
            statusTone: "info",
          },
          {
            title: "Targetologlar samaradorligi",
            subtitle: "Top-5 targetologlar ro‘yxatini yangilang",
            status: "Yakunlanmagan",
            statusTone: "warning",
          },
        ],
      },
    ],
  },
  "seller-admin": {
    slug: "seller-admin",
    label: "Seller Admin",
    title: "Sotuvchilar boshqaruvi",
    description: "Sotuvchilar va ularning natijalarini nazorat qilish.",
    nav: [
      {
        id: "sellers",
        title: "Sotuvchilar",
        icon: "user-check",
        items: [
          { label: "Sotuvchilar ro‘yxati", href: "#" },
          { label: "Reytinglar", href: "#" },
          { label: "Samaradorlik ko‘rsatkichlari", href: "#" },
        ],
      },
      {
        id: "performance",
        title: "Samaradorlik",
        icon: "chart",
        items: [
          { label: "Kunlik savdo", href: "#" },
          { label: "Top mahsulotlar", href: "#" },
        ],
      },
      {
        id: "mentorship",
        title: "Mentorlik",
        icon: "shield",
        items: [
          { label: "Mentor tayinlash", href: "#" },
          { label: "Motivatsiya tizimi", href: "#" },
        ],
      },
    ],
    metrics: [
      { label: "Faol sotuvchilar", value: "64" },
      { label: "Bugungi savdo", value: "248 ta", change: "+7.1%", tone: "positive" },
      { label: "O‘rtacha chek", value: "420 000 so‘m" },
      { label: "Bonusga nomzodlar", value: "12", tone: "neutral" },
    ],
    sections: [
      {
        title: "Samaradorlik ko‘rsatkichlari",
        items: [
          {
            title: "Top sotuvchi",
            subtitle: "Murodjon A. — 58 ta muvaffaqiyatli savdo",
            status: "Mukofotlash tavsiya etiladi",
            statusTone: "success",
          },
          {
            title: "Performance monitoring",
            subtitle: "Ikkinchi chorak uchun reja 82% bajarildi",
            status: "Kuzatuv",
            statusTone: "info",
          },
        ],
      },
    ],
  },
  "sklad-admin": {
    slug: "sklad-admin",
    label: "Sklad Admin",
    title: "Ombor va logistika paneli",
    description: "Ombordagi mahsulotlar va yetkazib berishni boshqarish.",
    nav: [
      {
        id: "inventory",
        title: "Inventarizatsiya",
        icon: "warehouse",
        items: [
          { label: "Mahsulotlar ro‘yxati", href: "#" },
          { label: "Zaxira darajasi", href: "#" },
          { label: "Kutilayotgan yetkazib berish", href: "#" },
        ],
      },
      {
        id: "delivery",
        title: "Yetkazib berish",
        icon: "cart",
        items: [
          { label: "Jo‘natilgan yuklar", href: "#" },
          { label: "Yo‘ldagi yetkazib berish", href: "#" },
          { label: "Qaytarilgan mahsulotlar", href: "#" },
        ],
      },
      {
        id: "alerts",
        title: "Ogohlantirishlar",
        icon: "bell",
        items: [
          { label: "Past zaxiralar", href: "#", badge: "3" },
          { label: "Yaroqlilik muddati", href: "#" },
        ],
      },
    ],
    metrics: [
      { label: "Ombordagi mahsulotlar", value: "18 240 dona" },
      { label: "Bugungi jo‘natishlar", value: "164 ta", change: "+3.1%", tone: "positive" },
      { label: "Kutilayotgan yetkazib berish", value: "42 ta" },
      { label: "Qaytarilgan buyurtmalar", value: "6 ta", change: "-1.4%", tone: "positive" },
    ],
    sections: [
      {
        title: "Ombor holati",
        items: [
          {
            title: "Yangi partiya qabul qilindi",
            subtitle: "Smartfonlar — 240 dona",
            status: "Yakunlangan",
            statusTone: "success",
          },
          {
            title: "Zaxira nazorati",
            subtitle: "3 ta mahsulot zaxirasi past darajada",
            status: "Diqqat",
            statusTone: "warning",
          },
        ],
      },
    ],
  },
  targetolog: {
    slug: "targetolog",
    label: "Targetolog",
    title: "Targetologlar uchun panel",
    description: "Shaxsiy lidlar, statistika va to‘lovlarni kuzatish.",
    nav: [
      {
        id: "overview",
        title: "Umumiy ko‘rinish",
        icon: "home",
        items: [
          { label: "Bosh sahifa", href: "#" },
          { label: "Natijalarim", href: "#" },
          { label: "Kampaniyalar", href: "#" },
        ],
      },
      {
        id: "leads",
        title: "Mening lidlarim",
        icon: "target",
        items: [
          { label: "Yangi lidlar", href: "#" },
          { label: "Jarayondagi lidlar", href: "#" },
          { label: "Muvaffaqiyatli lidlar", href: "#" },
        ],
      },
      {
        id: "finance",
        title: "Moliyaviy ko‘rsatkichlar",
        icon: "money",
        items: [
          { label: "To‘lovlar tarixi", href: "#" },
          { label: "Mukofot rejalari", href: "#" },
          { label: "Hisob-fakturalar", href: "#" },
        ],
      },
    ],
    metrics: [
      { label: "Bugungi lidlar", value: "32 ta", change: "+5 ta", tone: "positive" },
      { label: "Konversiya darajasi", value: "7.8%", change: "+0.9%", tone: "positive" },
      { label: "Oylik to‘lov", value: "8 450 000 so‘m" },
      { label: "Aktiv kampaniyalar", value: "5 ta" },
    ],
    sections: [
      {
        title: "Kunlik vazifalar",
        items: [
          {
            title: "Facebook kampaniyasi",
            subtitle: "Byudjetni oshirish talab etiladi",
            status: "Diqqat",
            statusTone: "warning",
          },
          {
            title: "Yangi lidlarni tekshirish",
            subtitle: "12 ta yangi lid tasdiqlash jarayonida",
            status: "Jarayonda",
            statusTone: "info",
          },
        ],
      },
    ],
  },
  operator: {
    slug: "operator",
    label: "Operator",
    title: "Operator boshqaruv paneli",
    description:
      "Biriktirilgan buyurtmalarni ko‘rib chiqish va holatini yangilash.",
    nav: [
      {
        id: "orders",
        title: "Buyurtmalar",
        icon: "cart",
        items: [
          { label: "Bugungi buyurtmalar", href: "#" },
          { label: "Jarayondagi buyurtmalar", href: "#" },
          { label: "Yakunlangan buyurtmalar", href: "#" },
        ],
      },
      {
        id: "customers",
        title: "Mijozlar bilan aloqa",
        icon: "users",
        items: [
          { label: "Qo‘ng‘iroqlar jurnali", href: "#" },
          { label: "Eslatmalar", href: "#" },
        ],
      },
      {
        id: "support",
        title: "Qo‘llab-quvvatlash",
        icon: "shield",
        items: [
          { label: "Skriptlar", href: "#" },
          { label: "FAQ", href: "#" },
        ],
      },
    ],
    metrics: [
      { label: "Bugungi buyurtmalar", value: "68 ta", change: "+6 ta", tone: "positive" },
      { label: "Yakunlangan buyurtmalar", value: "52 ta", change: "+3 ta", tone: "positive" },
      { label: "Qayta aloqa talab qilinadi", value: "8 ta", tone: "neutral" },
      { label: "O‘rtacha ishlov berish vaqti", value: "6 daqiqa 24 soniya" },
    ],
    sections: [
      {
        title: "Bugungi vazifalar",
        items: [
          {
            title: "Yangi buyurtmalarni tasdiqlash",
            subtitle: "17 ta buyurtma mijoz bilan suhbat kutyapti",
            status: "Ustuvor",
            statusTone: "warning",
          },
          {
            title: "Yetkazib berishni nazorat qilish",
            subtitle: "Shahar ichida 9 ta buyurtma yetkazilmoqda",
            status: "Jarayonda",
            statusTone: "info",
          },
        ],
      },
    ],
  },
};

export const SUPPORTED_DASHBOARD_ROLES = Object.keys(DASHBOARD_CONFIG);

export function getDashboardConfig(role: string): DashboardRoleConfig | undefined {
  const normalized = role.toLowerCase();
  return DASHBOARD_CONFIG[normalized];
}
