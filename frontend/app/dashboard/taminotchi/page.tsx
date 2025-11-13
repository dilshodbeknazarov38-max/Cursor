import DashboardLayout from '@/components/DashboardLayout';
import ProductForm from '@/components/ProductForm';

const TaminotchiDashboardPage = () => {
  return (
    <DashboardLayout role="taminotchi">
      <div className="space-y-8">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Taminotchi Dashboard</h2>
          <p className="mt-2 text-sm text-slate-500">Mahsulotlar ro‘yxati, yetkazib berish holati va balans nazorati.</p>
        </header>

        <ProductForm />

        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          Yaratilgan mahsulotlar avtomatik ravishda inventar ro‘yxatiga qo‘shiladi.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TaminotchiDashboardPage;
