import DashboardLayout from '@/components/DashboardLayout';
import BalanceCard from '@/components/BalanceCard';

const AdminDashboardPage = () => {
  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h2>
          <p className="mt-2 text-sm text-slate-500">
            Platformaning umumiy boshqaruvi, KPI lar va tezkor ko‘rsatkichlar.
          </p>
        </header>

        <BalanceCard mainBalance={42000000} holdBalance={12500000} />

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Bugungi KPI</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">78% bajarilgan</h3>
            <p className="mt-1 text-sm text-slate-500">Operator va marketing bo‘limlari KPI lari.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Faol kampaniyalar</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">12 ta kampaniya</h3>
            <p className="mt-1 text-sm text-slate-500">Target va operator bo‘limlari bilan muvofiqlashtirilgan.</p>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
