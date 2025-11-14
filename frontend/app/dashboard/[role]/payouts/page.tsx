'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import BalanceCard, {
  BalanceCardHandle,
} from '@/components/BalanceCard';
import DashboardLayout from '@/components/DashboardLayout';
import PayoutModal from '@/components/PayoutModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiGet, ApiError } from '@/lib/apiClient';

type PayoutRow = {
  id: string;
  amount: number;
  status: string;
  cardNumber: string;
  cardHolder: string;
  comment?: string | null;
  createdAt: string;
};

type RolePayoutPageProps = {
  params: {
    role: string;
  };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
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

export default function RolePayoutsPage({ params }: RolePayoutPageProps) {
  const { toast } = useToast();
  const balanceRef = useRef<BalanceCardHandle>(null);

  const [balance, setBalance] = useState<{
    holdBalance: number;
    mainBalance: number;
    availableForPayout: number;
  }>({
    holdBalance: 0,
    mainBalance: 0,
    availableForPayout: 0,
  });
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Array<any>>('/payouts/me');
      setPayouts(
        data.map((item) => ({
          id: item.id,
          amount: Number(item.amount),
          status: item.status,
          cardNumber: item.cardNumber,
          cardHolder: item.cardHolder,
          comment: item.comment,
          createdAt: item.createdAt,
        })),
      );
    } catch (requestError) {
      let message = 'Payout so‘rovlarini yuklab bo‘lmadi.';
      if (requestError instanceof ApiError) {
        message = requestError.message;
      } else if (requestError instanceof Error) {
        message = requestError.message;
      }
      setError(message);
      toast({
        title: 'Xatolik',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleModalSuccess = async () => {
    await balanceRef.current?.refresh();
    await fetchPayouts();
  };

  return (
    <DashboardLayout role={params.role}>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Balans va payoutlar
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Balansingizni kuzatib boring va yechib olish so‘rovlarini boshqaring.
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            disabled={balance.availableForPayout <= 0}
          >
            Yechib olish so‘rovi
          </Button>
        </div>

        <BalanceCard ref={balanceRef} onBalanceChange={setBalance} />

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Yechib olish so‘rovlari tarixi
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Payout so‘rovlari statusini kuzatib boring.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchPayouts} disabled={loading}>
              Yangilash
            </Button>
          </header>

          {loading ? (
            <div className="px-5 py-6 text-sm text-slate-500">
              Ma’lumotlar yuklanmoqda...
            </div>
          ) : error ? (
            <div className="px-5 py-6 text-sm text-red-600">{error}</div>
          ) : payouts.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-500">
              Hozircha payout so‘rovlari mavjud emas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Summa</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Karta</th>
                    <th className="px-4 py-3 text-left">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {payout.id.slice(0, 12)}…
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={statusBadgeClass(payout.status)}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {payout.cardNumber.replace(/.(?=.{4})/g, '•')}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDateTime(payout.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <PayoutModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mainBalance={balance.mainBalance}
        onSuccess={handleModalSuccess}
      />
    </DashboardLayout>
  );
}

const statusBadgeClass = (status: string) => {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide';
  switch (status) {
    case 'APPROVED':
      return `${base} bg-emerald-100 text-emerald-700`;
    case 'REJECTED':
      return `${base} bg-red-100 text-red-700`;
    default:
      return `${base} bg-amber-100 text-amber-700`;
  }
};
