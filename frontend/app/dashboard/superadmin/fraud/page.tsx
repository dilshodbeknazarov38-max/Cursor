import DashboardLayout from '@/components/DashboardLayout';

const SuperAdminFraudPage = () => {
  return (
    <DashboardLayout role="superadmin">
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Fraud monitoring paneli</h2>
          <p className="mt-2 text-sm text-slate-500">
            Shubhali foydalanuvchilar, IP manzillar va to‘lov kartalarini kuzatish uchun markaziy monitoring.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">IP monitoring</p>
            <p className="mt-2 text-sm text-slate-600">
              IP manzillar bo‘yicha bloklash va ogohlantirishlar shu yerda chiqadi.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Karta monitoring</p>
            <p className="mt-2 text-sm text-slate-600">
              Shubhali to‘lov kartalari va tranzaksiyalarni nazorat qilish uchun panel.
            </p>
          </article>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          Fraud siyosati va avtomatik qoidalar konfiguratsiyasi shu bo‘limda joylashadi.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminFraudPage;
