import DashboardLayout from '@/components/DashboardLayout';

const SuperAdminDashboardPage = () => {
  return (
    <DashboardLayout role="superadmin">
      <div className="space-y-8">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">SuperAdmin boshqaruv paneli</h2>
          <p className="mt-2 text-sm text-slate-500">
            Platformaning barcha bo‘limlari, rollari va xavfsizlik sozlamalarini bir joydan nazorat qiling.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Platforma</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Global boshqaruv</h3>
            <p className="mt-1 text-sm text-slate-500">Har bir modul va bo‘lim uchun tezkor kirish.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Fraud monitoring</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Shubhali faoliyat</h3>
            <p className="mt-1 text-sm text-slate-500">IP, karta va leadlar asosida real-time ogohlantirishlar.</p>
          </article>
        </section>

        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          SuperAdmin sifatida barcha admin panel sahifalariga to‘liq kirish imkoniyati mavjud.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboardPage;
