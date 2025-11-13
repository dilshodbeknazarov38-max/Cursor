type BalanceCardProps = {
  holdBalance: number;
  mainBalance: number;
  currency?: string;
};

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const BalanceCard = ({ holdBalance, mainBalance, currency = 'UZS' }: BalanceCardProps) => {
  return (
    <section className="grid gap-4 rounded-xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm sm:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Asosiy balans</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(mainBalance, currency)}</p>
        <p className="mt-1 text-sm text-slate-500">Foydalanish uchun tayyor mablag‘.</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Hold balans</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(holdBalance, currency)}</p>
        <p className="mt-1 text-sm text-slate-500">Tasdiqlanish jarayonidagi summalar.</p>
      </div>
    </section>
  );
};

export type { BalanceCardProps };
export default BalanceCard;
