import DashboardLayout from '@/components/DashboardLayout';
import BalanceCard from '@/components/BalanceCard';

const OperAdminDashboardPage = () => {
  return (
    <DashboardLayout role="oper-admin">
      <div className="space-y-8">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Oper Admin Dashboard</h2>
          <p className="mt-2 text-sm text-slate-500">Operatorlar jarayonlari, lead oqimi va sifat monitoringi.</p>
        </header>

        <BalanceCard mainBalance={17500000} holdBalance={4300000} />

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Yangi lidlar</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">245 ta</h3>
            <p className="mt-1 text-sm text-slate-500">Bugungi kelib tushgan lidlar soni.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Konversiya</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">32%</h3>
            <p className="mt-1 text-sm text-slate-500">Operatorlar samaradorligi.</p>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default OperAdminDashboardPage;
