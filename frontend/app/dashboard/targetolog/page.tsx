'use client';

import { useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { apiGet } from '@/lib/apiClient';

type FlowPerformance = {
  id: string;
  title: string;
  productTitle: string | null;
  clicks: number;
  leads: number;
  orders: number;
  confirmedOrders: number;
  conversionRate: number;
  status: string;
};

type BalanceSnapshot = {
  hold: string;
  main: string;
  total: string;
  updatedAt: string | null;
};

type BalanceTransaction = {
  id: string;
  type: string;
  amount: string;
  createdAt: string;
  meta: Record<string, unknown> | null;
};

type AnalyticsResponse = {
  role: string;
  metrics: {
    clicks: number;
    leads: number;
    confirmedOrders: number;
    revenue: number;
  };
  balance: BalanceSnapshot;
  flowPerformance: FlowPerformance[];
  transactions: BalanceTransaction[];
};

const transactionLabels: Record<string, string> = {
  HOLD_ADD: 'Hold qo‘shildi',
  HOLD_RELEASE: 'Hold asosiy balansga o‘tkazildi',
  HOLD_REMOVE: 'Hold kamaytirildi',
  MAIN_ADD: 'Asosiy balans oshirildi',
  MAIN_REMOVE: 'Asosiy balans kamaytirildi',
};

const currencyFormatter = new Intl.NumberFormat('uz-UZ', {
  style: 'currency',
  currency: 'UZS',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('uz-UZ');

const formatCurrency = (value: number | string) =>
  currencyFormatter.format(Number(value ?? 0));

const formatNumber = (value: number) => numberFormatter.format(value);

const TargetologDashboardPage = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await apiGet<AnalyticsResponse>('/stats/me/analytics');
        setAnalytics(response);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Analitika ma’lumotlarini yuklab bo‘lmadi.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchAnalytics();
  }, [toast]);

  const summaryCards = useMemo(() => {
    if (!analytics) {
      return [];
    }
    const { metrics } = analytics;
    return [
      {
        label: 'Kliklar',
        value: formatNumber(metrics.clicks),
        description: 'Oqim havolalariga bosishlar soni',
      },
      {
        label: 'Leadlar',
        value: formatNumber(metrics.leads),
        description: 'Qabul qilingan leadlar soni',
      },
      {
        label: 'Tasdiqlangan buyurtmalar',
        value: formatNumber(metrics.confirmedOrders),
        description: 'Yetkazilgan buyurtmalar soni',
      },
      {
        label: 'Daromad',
        value: formatCurrency(metrics.revenue),
        description: 'Holddan asosiy balansga o‘tgan summa',
      },
    ];
  }, [analytics]);

  const transactions = analytics?.transactions ?? [];
  const flowPerformance = analytics?.flowPerformance ?? [];

  return (
    <DashboardLayout role="targetolog">
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Kampaniya analitikasi</h1>
          <p className="text-sm text-slate-500">
            Trafik oqimlarining samaradorligi, leadlar va moliyaviy natijalarni nazorat qiling.
          </p>
        </header>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
            Ma’lumotlar yuklanmoqda...
          </div>
        ) : analytics ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <Card key={card.label} className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      {card.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-slate-900">{card.value}</div>
                    <p className="mt-2 text-xs text-slate-500">{card.description}</p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="border-slate-200 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Oqimlar samaradorligi
                  </CardTitle>
                  <p className="text-sm text-slate-500">
                    Har bir oqim bo‘yicha asosiy ko‘rsatkichlar va konversiya darajasi.
                  </p>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {flowPerformance.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                      Hozircha oqimlar bo‘yicha statistik ma’lumotlar mavjud emas.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left">Oqim</th>
                          <th className="px-4 py-3 text-left">Mahsulot</th>
                          <th className="px-4 py-3 text-right">Kliklar</th>
                          <th className="px-4 py-3 text-right">Leadlar</th>
                          <th className="px-4 py-3 text-right">Buyurtmalar</th>
                          <th className="px-4 py-3 text-right">Tasdiqlangan</th>
                          <th className="px-4 py-3 text-right">Konversiya</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {flowPerformance.map((flow) => (
                          <tr key={flow.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-medium text-slate-900">{flow.title}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {flow.productTitle ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatNumber(flow.clicks)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatNumber(flow.leads)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatNumber(flow.orders)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatNumber(flow.confirmedOrders)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {flow.conversionRate.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Balans yangilanishlari
                  </CardTitle>
                  <p className="text-sm text-slate-500">
                    Hold va asosiy balansdagi so‘nggi o‘zgarishlar.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Hold balans</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(analytics.balance.hold)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                      <span>Asosiy balans</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(analytics.balance.main)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                      <span>Jami</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(analytics.balance.total)}
                      </span>
                    </div>
                    {analytics.balance.updatedAt ? (
                      <p className="mt-3 text-xs text-slate-500">
                        Yangilangan: {new Date(analytics.balance.updatedAt).toLocaleString('uz-UZ')}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    {transactions.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
                        Hozircha tranzaksiya yozuvlari mavjud emas.
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {transactions.map((transaction) => {
                          const amountValue = Number(transaction.amount ?? 0);
                          const isNegative =
                            transaction.type === 'HOLD_REMOVE' ||
                            transaction.type === 'MAIN_REMOVE';
                          const formattedAmount = formatCurrency(
                            Math.abs(amountValue),
                          );
                          const label =
                            transactionLabels[transaction.type] ??
                            transaction.type.toLowerCase();

                          const meta =
                            typeof transaction.meta === 'object' && transaction.meta !== null
                              ? (transaction.meta as Record<string, unknown>)
                              : null;
                          const relatedIds = meta
                            ? [meta?.['orderId'], meta?.['leadId']].filter(
                                (value): value is string =>
                                  typeof value === 'string' && value.length > 0,
                              )
                            : [];
                          const related = relatedIds.join(' · ');

                          return (
                            <li
                              key={transaction.id}
                              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-slate-900">{label}</p>
                                  <p className="text-xs text-slate-500">
                                    {new Date(transaction.createdAt).toLocaleString('uz-UZ')}
                                  </p>
                                  {related ? (
                                    <p className="mt-1 text-xs text-slate-400">{related}</p>
                                  ) : null}
                                </div>
                                <span
                                  className={`text-sm font-semibold ${
                                    isNegative ? 'text-rose-600' : 'text-emerald-600'
                                  }`}
                                >
                                  {isNegative ? '-' : '+'} {formattedAmount}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
            Analitika ma’lumotlari topilmadi.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TargetologDashboardPage;
