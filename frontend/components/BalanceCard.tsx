'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';

import { apiGet } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

type BalanceApiResponse = {
  holdBalance: string | number;
  mainBalance: string | number;
  availableForPayout?: string | number;
  transactions?: Array<{
    id: string;
    type: string;
    amount: string | number;
    meta?: unknown;
    createdAt: string;
  }>;
};

type BalanceTransaction = {
  id: string;
  type: string;
  amount: number;
  meta?: unknown;
  createdAt: string;
};

type BalanceCardProps = {
  refreshSignal?: number;
  onBalanceChange?: (payload: {
    holdBalance: number;
    mainBalance: number;
    availableForPayout: number;
  }) => void;
  className?: string;
};

export type BalanceCardHandle = {
  refresh: () => Promise<void>;
};

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const parseNumber = (value: string | number | undefined | null): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (!value) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const BalanceCard = forwardRef<BalanceCardHandle, BalanceCardProps>(
  ({ refreshSignal, onBalanceChange, className }, ref) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [holdBalance, setHoldBalance] = useState(0);
    const [mainBalance, setMainBalance] = useState(0);
    const [availableBalance, setAvailableBalance] = useState(0);
    const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiGet<BalanceApiResponse>('/balance/me');
        const hold = parseNumber(response.holdBalance);
        const main = parseNumber(response.mainBalance);
        const available = parseNumber(response.availableForPayout ?? response.mainBalance);
        setHoldBalance(hold);
        setMainBalance(main);
        setAvailableBalance(available);
        setTransactions(
          (response.transactions ?? []).map((tx) => ({
            id: tx.id,
            type: tx.type,
            amount: parseNumber(tx.amount),
            meta: tx.meta,
            createdAt: tx.createdAt,
          })),
        );

        onBalanceChange?.({
          holdBalance: hold,
          mainBalance: main,
          availableForPayout: available,
        });
      } catch (fetchError) {
        if (fetchError instanceof Error) {
          setError(fetchError.message);
        } else {
          setError('Balans ma’lumotlarini yuklab bo‘lmadi.');
        }
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refresh: fetchBalance,
    }));

    useEffect(() => {
      fetchBalance();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshSignal]);

    const content = useMemo(() => {
      if (loading) {
        return (
          <div className="col-span-full flex items-center justify-center px-4 py-6 text-sm text-slate-500">
            Balans ma’lumotlari yuklanmoqda...
          </div>
        );
      }

      if (error) {
        return (
          <div className="col-span-full px-4 py-4 text-sm text-red-600">
            {error}
          </div>
        );
      }

      return (
        <>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Asosiy balans
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {formatCurrency(mainBalance, 'UZS')}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Foydalanish uchun tayyor mablag‘.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Hold balans
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {formatCurrency(holdBalance, 'UZS')}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Tasdiqlanish jarayonidagi summalar.
            </p>
          </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Payout uchun mavjud
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatCurrency(availableBalance, 'UZS')}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Yechib olish so‘rovi uchun asosiy balansdagi summa.
          </p>
        </div>
        </>
      );
    }, [availableBalance, error, holdBalance, loading, mainBalance]);

    return (
      <section className={cn('space-y-6', className)}>
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm sm:grid-cols-3">
          {content}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Oxirgi tranzaksiyalar
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              So‘nggi 20ta balans o‘zgarishi ro‘yxati.
            </p>
          </header>

          {loading ? (
            <div className="px-5 py-6 text-sm text-slate-500">
              Tranzaksiyalar yuklanmoqda...
            </div>
          ) : error ? (
            <div className="px-5 py-6 text-sm text-red-600">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-500">
              Hozircha tranzaksiyalar mavjud emas.
            </div>
          ) : (
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Tranzaksiya</th>
                    <th className="px-4 py-3 text-left">Summa</th>
                    <th className="px-4 py-3 text-left">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {transaction.type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-slate-800">
                        {formatCurrency(transaction.amount, 'UZS')}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDateTime(transaction.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    );
  },
);

BalanceCard.displayName = 'BalanceCard';

export type { BalanceCardProps, BalanceCardHandle };
export default BalanceCard;
