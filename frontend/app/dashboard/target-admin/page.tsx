import DashboardLayout from '@/components/DashboardLayout';

const TargetAdminDashboardPage = () => {
  return (
    <DashboardLayout role="target-admin">
      <div className="space-y-8">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Target Admin Dashboard</h2>
          <p className="mt-2 text-sm text-slate-500">
            Kampaniyalar, trafik manbalari va byudjetlarni boshqarish uchun tayyorlangan ko‘rinish.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Faol kampaniyalar</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">12 ta kampaniya</h3>
            <p className="mt-1 text-sm text-slate-500">Eng yangi UTM lar va trafik oqimlari.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Byudjet</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">8,5 mlrd UZS</h3>
            <p className="mt-1 text-sm text-slate-500">Oy yakunigacha rejalashtirilgan sarf.</p>
          </article>
        </section>

        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          Kampaniya parametrlari va kreativlar uchun tezkor boshqaruv paneli tayyor.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TargetAdminDashboardPage;
