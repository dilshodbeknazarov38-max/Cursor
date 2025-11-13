import { Role } from './roles';

export type RolePermission = {
  label: string;
  href: string;
  description?: string;
};

export const ROLE_PERMISSIONS: Record<Role, RolePermission[]> = {
  [Role.SUPER_ADMIN]: [
    { label: 'Platforma', href: '/dashboard/superadmin', description: 'Tizimning umumiy boshqaruvi' },
    { label: 'Foydalanuvchilar', href: '/dashboard/superadmin/users', description: 'Barcha rollarni va userlarni boshqarish' },
    { label: 'Moliya', href: '/dashboard/superadmin/finance', description: 'Global balans, payouts, tranzaksiyalar' },
    { label: 'Payoutlar', href: '/dashboard/superadmin/finance', description: 'Payout so‘rovlari boshqaruvi' },
    { label: 'Fraud', href: '/dashboard/superadmin/fraud', description: 'Fraud tekshiruvlari va shubhali faoliyat' },
    { label: 'Sozlamalar', href: '/dashboard/superadmin/settings', description: 'Tizim sozlamalari' },
  ],
  [Role.ADMIN]: [
    { label: 'Umumiy ko‘rinish', href: '/dashboard/admin', description: 'Asosiy metrikalar' },
    { label: 'Balans', href: '/dashboard/admin/payouts', description: 'Balans va payoutlar' },
    { label: 'Jamoadoshlar', href: '/dashboard/admin/team', description: 'Rol va huquqlar' },
    { label: 'Moliya', href: '/dashboard/admin/finance', description: 'Balans va hisobotlar' },
    { label: 'Sozlamalar', href: '/dashboard/admin/settings', description: 'Platforma sozlamalari' },
  ],
  [Role.TARGET_ADMIN]: [
    { label: 'Balans', href: '/dashboard/target-admin/payouts', description: 'Balans va payout jarayoni' },
    { label: 'Kampaniyalar', href: '/dashboard/target-admin/campaigns', description: 'Aktiv kampaniyalar' },
    { label: 'Traffic manbalari', href: '/dashboard/target-admin/sources', description: 'Manbalar boshqaruvi' },
    { label: 'Byudjetlar', href: '/dashboard/target-admin/budgets', description: 'Ajratilgan byudjetlar' },
    { label: 'Analitika', href: '/dashboard/target-admin/analytics', description: 'Natija hisobotlari' },
  ],
  [Role.OPER_ADMIN]: [
    { label: 'Balans', href: '/dashboard/oper-admin/payouts', description: 'Balans va hisob-kitoblar' },
    { label: 'Lidlar', href: '/dashboard/oper-admin/leads', description: 'Kelib tushgan lead oqimi' },
    { label: 'Operatorlar', href: '/dashboard/oper-admin/operators', description: 'Operator monitoringi' },
    { label: 'Sifat nazorati', href: '/dashboard/oper-admin/quality', description: 'Qo‘ng‘iroqlar tahlili' },
    { label: 'Hisobotlar', href: '/dashboard/oper-admin/reports', description: 'Kunlik KPI' },
  ],
  [Role.SKLAD_ADMIN]: [
    { label: 'Balans', href: '/dashboard/sklad-admin/payouts', description: 'Balans va payoutlar' },
    { label: 'Tasdiqlash kutilayotgan mahsulotlar', href: '/dashboard/sklad-admin/products', description: 'Yangi mahsulotlarni ko‘rib chiqish' },
    { label: 'Barcha mahsulotlar', href: '/dashboard/sklad-admin/products/all', description: 'Tasdiqlangan mahsulotlar ro‘yxati' },
    { label: 'Jo‘natmalar', href: '/dashboard/sklad-admin/shipments', description: 'Logistika holati' },
    { label: 'Qaytishlar', href: '/dashboard/sklad-admin/returns', description: 'Qaytgan buyurtmalar' },
  ],
  [Role.TAMINOTCHI]: [
    { label: 'Balans', href: '/dashboard/taminotchi/payouts', description: 'Balans va payout tarixi' },
    { label: 'Mahsulotlar', href: '/dashboard/taminotchi/products', description: 'Mahsulot ro‘yxati' },
    { label: 'Yangi mahsulot qo‘shish', href: '/dashboard/taminotchi/products/new', description: 'Yangi mahsulot yaratish' },
    { label: 'Talablar', href: '/dashboard/taminotchi/requests', description: 'Sotuvdan kelgan talablar' },
    { label: 'Hisob-kitoblar', href: '/dashboard/taminotchi/payments', description: 'To‘lov va balans' },
  ],
  [Role.TARGETOLOG]: [
    { label: 'Balans', href: '/dashboard/targetolog/payouts', description: 'Balans va payoutlar' },
    { label: 'Oqimlar', href: '/dashboard/targetolog/flows', description: 'Yaratilgan oqimlar' },
    { label: 'Yangi oqim yaratish', href: '/dashboard/targetolog/flows/new', description: 'Mahsulot uchun yangi oqim yaratish' },
    { label: 'Ko‘rsatkichlar', href: '/dashboard/targetolog/performance', description: 'Kampaniya samaradorligi' },
    { label: 'Kreativlar', href: '/dashboard/targetolog/creatives', description: 'Banner va matnlar' },
  ],
  [Role.OPERATOR]: [
    { label: 'Balans', href: '/dashboard/operator/payouts', description: 'Balans va payoutlar' },
    { label: 'Navbat', href: '/dashboard/operator/queue', description: 'Faol lidlar navbati' },
    { label: 'Qo‘ng‘iroqlar', href: '/dashboard/operator/calls', description: 'Yaqinda qilingan qo‘ng‘iroqlar' },
    { label: 'Ssenariylar', href: '/dashboard/operator/scripts', description: 'Operator ssenariylari' },
    { label: 'Natijalar', href: '/dashboard/operator/results', description: 'Konversiya tahlili' },
  ],
};
