'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiGet, apiPut, ApiError } from '@/lib/apiClient';

type AdminPayoutRow = {
  id: string;
  userId: string;
  amount: number;
  status: string;
  cardNumber: string;
  cardHolder: string;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    nickname?: string | null;
  } | null;
};

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

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

const buildUserLabel = (payout: AdminPayoutRow) => {
  if (!payout.user) {
    return payout.userId;
  }
  const nameParts = [payout.user.firstName, payout.user.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (nameParts) {
    return `${nameParts} (${payout.user.nickname ?? payout.userId})`;
  }
  return payout.user.nickname ?? payout.userId;
};

export default function SuperAdminFinancePage() {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<AdminPayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query =
        statusFilter === 'ALL' ? '' : `?status=${encodeURIComponent(statusFilter)}`;
      const data = await apiGet<Array<any>>(`/admin/payouts${query}`);
      setPayouts(
        data.map((item) => ({
          id: item.id,
          userId: item.userId,
          amount: Number(item.amount),
          status: item.status,
          cardNumber: item.cardNumber,
          cardHolder: item.cardHolder,
          comment: item.comment,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          user: item.user ?? null,
        })),
      );
    } catch (requestError) {
      let message = 'Payout so‘rovlarini yuklashda xatolik yuz berdi.';
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
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleAction = async (
    payoutId: string,
    action: 'approve' | 'reject',
  ) => {
    try {
      setActionId(payoutId);
      const endpoint =
        action === 'approve'
          ? `/admin/payouts/${payoutId}/approve`
          : `/admin/payouts/${payoutId}/reject`;
      const response = await apiPut<{ payout: any }>(endpoint);

      setPayouts((prev) =>
        prev.map((row) =>
          row.id === payoutId
            ? {
                ...row,
                status: response.payout.status,
                updatedAt: response.payout.updatedAt,
              }
            : row,
        ),
      );

      toast({
        title:
          action === 'approve'
            ? 'Payout so‘rovi tasdiqlandi'
            : 'Payout so‘rovi rad etildi',
      });
    } catch (actionError) {
      let message = 'Amalni bajarib bo‘lmadi.';
      if (actionError instanceof ApiError) {
        message = actionError.message;
      } else if (actionError instanceof Error) {
        message = actionError.message;
      }
      toast({
        title: 'Xatolik',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  const filteredPayouts = useMemo(() => payouts, [payouts]);

  return (
    <DashboardLayout role="superadmin">
      <div className="space-y-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Payout so‘rovlari
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Barcha foydalanuvchilarning payout so‘rovlari va ularni tasdiqlash jarayoni.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as FilterStatus)
              }
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
            >
              <option value="ALL">Barcha statuslar</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <Button variant="outline" onClick={fetchPayouts} disabled={loading}>
              Yangilash
            </Button>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Payout so‘rovlari ro‘yxati
            </h2>
          </header>

          {loading ? (
            <div className="px-5 py-6 text-sm text-slate-500">
              Ma’lumotlar yuklanmoqda...
            </div>
          ) : error ? (
            <div className="px-5 py-6 text-sm text-red-600">{error}</div>
          ) : filteredPayouts.length === 0 ? (
            <div className="px-5 py-6 text-sm text-slate-500">
              Berilgan filtr bo‘yicha payout so‘rovlari topilmadi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Foydalanuvchi</th>
                    <th className="px-4 py-3 text-left">Summa</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Sana</th>
                    <th className="px-4 py-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredPayouts.map((payout) => {
                    const isPending = payout.status === 'PENDING';
                    const isProcessing = actionId === payout.id;
                    return (
                      <tr key={payout.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          {payout.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {buildUserLabel(payout)}
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
                          {formatDateTime(payout.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(payout.id, 'approve')}
                              disabled={!isPending || isProcessing}
                            >
                              {isProcessing && isPending ? '...' : 'Tasdiqlash'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(payout.id, 'reject')}
                              disabled={!isPending || isProcessing}
                            >
                              {isProcessing && isPending ? '...' : 'Rad etish'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
