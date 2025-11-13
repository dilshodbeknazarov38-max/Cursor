import DashboardLayout from '@/components/DashboardLayout';

const SuperAdminUsersPage = () => {
  return (
    <DashboardLayout role="superadmin">
      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Foydalanuvchilar boshqaruvi</h2>
          <p className="mt-2 text-sm text-slate-500">
            Barcha rollar, foydalanuvchilar va ruxsatlarni markazlashgan boshqaruv oynasi.
          </p>
        </header>

        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          Bu yerda foydalanuvchi yaratish, tahrirlash va bloklash uchun jadval hamda modallar joylashtiriladi.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminUsersPage;
