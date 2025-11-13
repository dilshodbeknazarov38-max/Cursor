import DashboardLayout from '@/components/DashboardLayout';

const TargetologDashboardPage = () => {
  return (
    <DashboardLayout role="targetolog">
      <div className="space-y-8">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Targetolog Dashboard</h2>
          <p className="mt-2 text-sm text-slate-500">Kampaniya samaradorligi va auditoriya segmentlarini kuzatish.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">CTR</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">3.5%</h3>
            <p className="mt-1 text-sm text-slate-500">So‘nggi 24 soatda o‘rtacha CTR ko‘rsatkichi.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">CPA</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">75 000 UZS</h3>
            <p className="mt-1 text-sm text-slate-500">Kampaniyalarning shakllangan o‘rtacha CPA qiymati.</p>
          </article>
        </section>

        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
          Auditoriyalar va kreativlar bo‘yicha barcha qarorlar shu bo‘limdan kuzatiladi.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TargetologDashboardPage;
