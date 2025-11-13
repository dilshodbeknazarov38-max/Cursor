type RoleMenuItem = {
  label: string;
  description?: string;
  href: string;
};

const roleMenus: Record<string, RoleMenuItem[]> = {
  admin: [
    { label: 'Umumiy ko‘rinish', description: 'Asosiy metrikalar', href: '/dashboard/admin' },
    { label: 'Jamoadoshlar', description: 'Huquq va rollar', href: '/dashboard/admin/team' },
    { label: 'Moliya', description: 'Hisobotlar va balans', href: '/dashboard/admin/finance' },
    { label: 'Sozlamalar', description: 'Platforma sozlamalari', href: '/dashboard/admin/settings' },
  ],
  'target-admin': [
    { label: 'Kampaniyalar', description: 'Aktiv kampaniyalar', href: '/dashboard/target-admin/campaigns' },
    { label: 'Traffic manbalari', description: 'Manbalar boshqaruvi', href: '/dashboard/target-admin/sources' },
    { label: 'Byudjetlar', description: 'Ajratilgan byudjetlar', href: '/dashboard/target-admin/budgets' },
    { label: 'Analitika', description: 'Natija hisobotlari', href: '/dashboard/target-admin/analytics' },
  ],
  'oper-admin': [
    { label: 'Lidlar', description: 'Yangi lidlar oqimi', href: '/dashboard/oper-admin/leads' },
    { label: 'Operatorlar', description: 'Operatorlar jadvali', href: '/dashboard/oper-admin/operators' },
    { label: 'Sifat nazorati', description: 'Qo‘ng‘iroqlar tahlili', href: '/dashboard/oper-admin/quality' },
    { label: 'Hisobotlar', description: 'Kunlik KPI', href: '/dashboard/oper-admin/reports' },
  ],
  'sklad-admin': [
    { label: 'Inventar', description: 'Skladdagi mahsulotlar', href: '/dashboard/sklad-admin/inventory' },
    { label: 'Jo‘natmalar', description: 'Yuborilgan va kutilayotgan', href: '/dashboard/sklad-admin/shipments' },
    { label: 'Qaytishlar', description: 'Qaytgan buyurtmalar', href: '/dashboard/sklad-admin/returns' },
    { label: 'Integratsiyalar', description: 'Sklad integratsiyalari', href: '/dashboard/sklad-admin/integrations' },
  ],
  taminotchi: [
    { label: 'Mahsulotlar', description: 'Mahsulot ro‘yxati', href: '/dashboard/taminotchi/products' },
    { label: 'Talablar', description: 'Sotuvdan kelgan talablar', href: '/dashboard/taminotchi/requests' },
    { label: 'Yetkazib berish', description: 'Logistika jarayoni', href: '/dashboard/taminotchi/deliveries' },
    { label: 'Hisob-kitoblar', description: 'To‘lov va balans', href: '/dashboard/taminotchi/payments' },
  ],
  targetolog: [
    { label: 'Ko‘rsatkichlar', description: 'Kampaniya samaradorligi', href: '/dashboard/targetolog/performance' },
    { label: 'Kreativlar', description: 'Banner va matnlar', href: '/dashboard/targetolog/creatives' },
    { label: 'Auditoriyalar', description: 'Segmentlar boshqaruvi', href: '/dashboard/targetolog/audiences' },
    { label: 'Test kampaniyalar', description: 'A/B testlari', href: '/dashboard/targetolog/tests' },
  ],
  operator: [
    { label: 'Navbat', description: 'On-hold lidlar', href: '/dashboard/operator/queue' },
    { label: 'Qo‘ng‘iroqlar', description: 'Yaqinda qilingan qo‘ng‘iroqlar', href: '/dashboard/operator/calls' },
    { label: 'Ssenariylar', description: 'Operator ssenariylari', href: '/dashboard/operator/scripts' },
    { label: 'Natijalar', description: 'Konversiya tahlili', href: '/dashboard/operator/results' },
  ],
};

const fallbackMenu: RoleMenuItem[] = [
  { label: 'Dashboard', description: 'Asosiy boshqaruv paneli', href: '/dashboard' },
];

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

function titleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

type RoleSidebarProps = {
  role: string;
};

const RoleSidebar = ({ role }: RoleSidebarProps) => {
  const normalizedRole = normalizeRole(role);
  const menu = roleMenus[normalizedRole] ?? fallbackMenu;
  const displayRole = titleCase(normalizedRole);

  return (
    <aside className="w-full border-b border-slate-200 bg-white lg:w-64 lg:border-b-0 lg:border-r">
      <div className="px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Rol</p>
        <h2 className="text-lg font-semibold text-slate-900">{displayRole || 'Dashboard'}</h2>
      </div>
      <nav className="space-y-1 px-2 pb-6">
        {menu.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col rounded-md px-4 py-3 transition hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
          >
            <span className="text-sm font-medium text-slate-800">{item.label}</span>
            {item.description ? <span className="text-xs text-slate-500">{item.description}</span> : null}
          </a>
        ))}
      </nav>
    </aside>
  );
};

export type { RoleMenuItem };
export { roleMenus };
export default RoleSidebar;
