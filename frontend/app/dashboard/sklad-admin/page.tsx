import DashboardLayout from '@/components/DashboardLayout';

const SkladAdminDashboardPage = () => {
  return (
    <DashboardLayout role="sklad-admin">
      <div className="space-y-8">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Sklad Admin Dashboard</h2>
          <p className="mt-2 text-sm text-slate-500">Inventar, jo‘natmalar va qaytishlar holati.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Sotuvga tayyor</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">1 250 dona</h3>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Yo‘lda</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">320 dona</h3>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Qaytishlar</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">45 dona</h3>
          </article>
        </section>

        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          Qabul qilish va jo‘natish jarayonlari bo‘yicha monitoring jadvali shu bo‘limda aks etadi.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SkladAdminDashboardPage;
