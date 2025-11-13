import { Role } from './roles';

export type RolePermission = {
  label: string;
  href: string;
  description?: string;
};

export const ROLE_PERMISSIONS: Record<Role, RolePermission[]> = {
  [Role.ADMIN]: [
    { label: 'Umumiy ko‘rinish', href: '/dashboard/admin', description: 'Asosiy metrikalar' },
    { label: 'Jamoadoshlar', href: '/dashboard/admin/team', description: 'Rol va huquqlar' },
    { label: 'Moliya', href: '/dashboard/admin/finance', description: 'Balans va hisobotlar' },
    { label: 'Sozlamalar', href: '/dashboard/admin/settings', description: 'Platforma sozlamalari' },
  ],
  [Role.TARGET_ADMIN]: [
    { label: 'Kampaniyalar', href: '/dashboard/target-admin/campaigns', description: 'Aktiv kampaniyalar' },
    { label: 'Traffic manbalari', href: '/dashboard/target-admin/sources', description: 'Manbalar boshqaruvi' },
    { label: 'Byudjetlar', href: '/dashboard/target-admin/budgets', description: 'Ajratilgan byudjetlar' },
    { label: 'Analitika', href: '/dashboard/target-admin/analytics', description: 'Natija hisobotlari' },
  ],
  [Role.OPER_ADMIN]: [
    { label: 'Lidlar', href: '/dashboard/oper-admin/leads', description: 'Kelib tushgan lead oqimi' },
    { label: 'Operatorlar', href: '/dashboard/oper-admin/operators', description: 'Operator monitoringi' },
    { label: 'Sifat nazorati', href: '/dashboard/oper-admin/quality', description: 'Qo‘ng‘iroqlar tahlili' },
    { label: 'Hisobotlar', href: '/dashboard/oper-admin/reports', description: 'Kunlik KPI' },
  ],
  [Role.SKLAD_ADMIN]: [
    { label: 'Inventar', href: '/dashboard/sklad-admin/inventory', description: 'Skladdagi mahsulotlar' },
    { label: 'Jo‘natmalar', href: '/dashboard/sklad-admin/shipments', description: 'Logistika holati' },
    { label: 'Qaytishlar', href: '/dashboard/sklad-admin/returns', description: 'Qaytgan buyurtmalar' },
    { label: 'Integratsiyalar', href: '/dashboard/sklad-admin/integrations', description: 'Sklad integratsiyalari' },
  ],
  [Role.TAMINOTCHI]: [
    { label: 'Mahsulotlar', href: '/dashboard/taminotchi/products', description: 'Mahsulot ro‘yxati' },
    { label: 'Talablar', href: '/dashboard/taminotchi/requests', description: 'Sotuvdan kelgan talablar' },
    { label: 'Yetkazib berish', href: '/dashboard/taminotchi/deliveries', description: 'Yetkazish jarayoni' },
    { label: 'Hisob-kitoblar', href: '/dashboard/taminotchi/payments', description: 'To‘lov va balans' },
  ],
  [Role.TARGETOLOG]: [
    { label: 'Ko‘rsatkichlar', href: '/dashboard/targetolog/performance', description: 'Kampaniya samaradorligi' },
    { label: 'Kreativlar', href: '/dashboard/targetolog/creatives', description: 'Banner va matnlar' },
    { label: 'Auditoriyalar', href: '/dashboard/targetolog/audiences', description: 'Segmentlar boshqaruvi' },
    { label: 'Test kampaniyalar', href: '/dashboard/targetolog/tests', description: 'A/B sinovlari' },
  ],
  [Role.OPERATOR]: [
    { label: 'Navbat', href: '/dashboard/operator/queue', description: 'Faol lidlar navbati' },
    { label: 'Qo‘ng‘iroqlar', href: '/dashboard/operator/calls', description: 'Yaqinda qilingan qo‘ng‘iroqlar' },
    { label: 'Ssenariylar', href: '/dashboard/operator/scripts', description: 'Operator ssenariylari' },
    { label: 'Natijalar', href: '/dashboard/operator/results', description: 'Konversiya tahlili' },
  ],
};
