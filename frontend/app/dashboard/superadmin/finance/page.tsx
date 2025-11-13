import DashboardLayout from '@/components/DashboardLayout';
import BalanceCard from '@/components/BalanceCard';

const SuperAdminFinancePage = () => {
  return (
    <DashboardLayout role="superadmin">
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Global moliya paneli</h2>
          <p className="mt-2 text-sm text-slate-500">
            Payoutlar, tranzaksiyalar va global balansni real vaqt rejimida kuzatish.
          </p>
        </header>

        <BalanceCard mainBalance={95000000} holdBalance={18500000} />

        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          To‘lov so‘rovlari, tranzaksiya tarixi va moliyaviy hisobotlar shu bo‘limda ko‘rsatiladi.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminFinancePage;
