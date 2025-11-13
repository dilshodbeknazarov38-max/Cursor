import DashboardLayout from '@/components/DashboardLayout';

const SuperAdminSettingsPage = () => {
  return (
    <DashboardLayout role="superadmin">
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Tizim sozlamalari</h2>
          <p className="mt-2 text-sm text-slate-500">
            API kalitlari, xavfsizlik sozlamalari va platforma konfiguratsiyasini yangilang.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">API kalitlari</p>
            <p className="mt-2 text-sm text-slate-600">Integratsiyalar uchun kalitlar ro‘yxati va boshqaruvi.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Xavfsizlik</p>
            <p className="mt-2 text-sm text-slate-600">2FA, IP whitelisting va audit log sozlamalari.</p>
          </article>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          Platforma umumiy konfiguratsiyasi va xizmatlarni yoqish/o‘chirish boshqaruvi shu yerda bo‘ladi.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminSettingsPage;
