import DashboardLayout from '@/components/DashboardLayout';

const OperatorDashboardPage = () => {
  return (
    <DashboardLayout role="operator">
      <div className="space-y-8">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Operator Dashboard</h2>
          <p className="mt-2 text-sm text-slate-500">Qo‘ng‘iroqlar navbati, javob berish tezligi va ssenariylar kutubxonasi.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Faol lidlar</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">67 ta</h3>
            <p className="mt-1 text-sm text-slate-500">Darhol ishlov berilishi kerak bo‘lgan lidlar.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Avg. qo‘ng‘iroq</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">04:32</h3>
            <p className="mt-1 text-sm text-slate-500">O‘rtacha qo‘ng‘iroq davomiyligi.</p>
          </article>
        </section>

        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          Payout talablarini tasdiqlash uchun modal komponenti (PayoutModal) mavjud.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OperatorDashboardPage;
