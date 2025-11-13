'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { apiGet } from '@/lib/apiClient';

type AnalyticsSummary = {
  range: {
    days: number;
    since: string;
  };
  metrics: {
    users: {
      total: number;
      active: number;
      newInRange: number;
    };
    leads: number;
    orders: number;
    revenue: number;
    flows: number;
    balances: {
      hold: number;
      main: number;
      total: number;
    };
    payouts: {
      pendingCount: number;
      pendingAmount: number;
    };
  };
  topFlows: Array<{
    id: string;
    title: string;
    slug: string;
    clicks: number;
    leads: number;
    orders: number;
    conversion: number;
  }>;
  topTargetologs: Array<{
    id: string | null;
    name: string;
    orders: number;
    revenue: number;
  }>;
  topOperators: Array<{
    id: string | null;
    name: string;
    handledOrders: number;
  }>;
};

type AnalyticsTrend = {
  range: {
    days: number;
    since: string;
  };
  daily: {
    leads: Array<{ date: string; value: number }>;
    orders: Array<{ date: string; value: number }>;
    revenue: Array<{ date: string; value: number }>;
    payouts: Array<{ date: string; value: number }>;
  };
  transactions: number;
  operatorHeatmap: Array<{
    id: string;
    name: string;
    total: number;
    delivered: number;
    returned: number;
    progress: number;
  }>;
};

const SuperAdminAnalyticsPage = () => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrend | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryResponse, trendsResponse] = await Promise.all([
        apiGet<AnalyticsSummary>('/admin/analytics/summary'),
        apiGet<AnalyticsTrend>('/admin/analytics/trends?days=14'),
      ]);
      setSummary(summaryResponse);
      setTrends(trendsResponse);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Analitika ma’lumotlarini yuklashda xatolik.';
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
    void loadAnalytics();
  }, [loadAnalytics]);

  const summaryCards = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      {
        title: 'Foydalanuvchilar',
        value: summary.metrics.users.total,
        accent: `${summary.metrics.users.active} aktiv · ${summary.metrics.users.newInRange} yangi (${summary.range.days} kun)`,
      },
      {
        title: 'Leadlar',
        value: summary.metrics.leads,
        accent: `${summary.metrics.orders} ta yetkazilgan buyurtma`,
      },
      {
        title: 'Umumiy daromad',
        value: summary.metrics.revenue,
        format: 'currency' as const,
        accent: `Aktiv oqimlar: ${summary.metrics.flows}`,
      },
      {
        title: 'Balans (Hold/Main)',
        value: summary.metrics.balances.total,
        format: 'currency' as const,
        accent: `Hold ${summary.metrics.balances.hold.toLocaleString('uz-UZ')} · Main ${summary.metrics.balances.main.toLocaleString('uz-UZ')}`,
      },
      {
        title: 'Kutilayotgan payoutlar',
        value: summary.metrics.payouts.pendingCount,
        accent: `${summary.metrics.payouts.pendingAmount.toLocaleString('uz-UZ')} so‘m`,
      },
    ];
  }, [summary]);

  return (
    <DashboardLayout role="superadmin">
      <div className="space-y-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Global analitika
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Platformaning barcha modullari bo‘yicha real-time ko‘rsatkichlar.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadAnalytics()} disabled={loading}>
              Yangilash
            </Button>
            {summary ? (
              <Badge variant="secondary">
                Oxirgi {summary.range.days} kun · {new Intl.DateTimeFormat('uz-UZ').format(new Date(summary.range.since))}
                {' '}dan boshlab
              </Badge>
            ) : null}
          </div>
        </header>

        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Ma’lumotlar yuklanmoqda...
          </div>
        ) : summary ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {summaryCards.map((card) => (
                <Card key={card.title} className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-slate-500">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-slate-900">
                      {card.format === 'currency'
                        ? `${card.value.toLocaleString('uz-UZ')} so‘m`
                        : card.value.toLocaleString('uz-UZ')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{card.accent}</p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Oqimlar reytingi</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Oqim</th>
                        <th className="px-4 py-3 text-left">Kliklar</th>
                        <th className="px-4 py-3 text-left">Leadlar</th>
                        <th className="px-4 py-3 text-left">Buyurtmalar</th>
                        <th className="px-4 py-3 text-left">Konversiya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary.topFlows.map((flow) => (
                        <tr key={flow.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{flow.title}</p>
                            <p className="text-xs text-slate-500">slug: {flow.slug}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{flow.clicks}</td>
                          <td className="px-4 py-3 text-slate-700">{flow.leads}</td>
                          <td className="px-4 py-3 text-slate-700">{flow.orders}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {flow.conversion.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                      {summary.topFlows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-6 text-center text-sm text-slate-500"
                          >
                            Hozircha oqimlar statistikasi mavjud emas.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Targetolog va operatorlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Targetologlar
                    </p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {summary.topTargetologs.map((targetolog) => (
                        <li key={targetolog.id ?? targetolog.name} className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="font-semibold text-slate-900">
                            {targetolog.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {targetolog.orders} ta buyurtma ·{' '}
                            {targetolog.revenue.toLocaleString('uz-UZ')} so‘m
                          </p>
                        </li>
                      ))}
                      {summary.topTargetologs.length === 0 ? (
                        <li className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          Targetolog statistikasi mavjud emas.
                        </li>
                      ) : null}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Operatorlar
                    </p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {summary.topOperators.map((operator) => (
                        <li key={operator.id ?? operator.name} className="rounded-lg bg-slate-50 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">
                              {operator.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {operator.handledOrders} ta buyurtma
                            </span>
                          </div>
                        </li>
                      ))}
                      {summary.topOperators.length === 0 ? (
                        <li className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          Operator statistikasi mavjud emas.
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {trends ? (
              <section className="grid gap-4 lg:grid-cols-2">
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Kundalik trendlar</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left">Sana</th>
                          <th className="px-4 py-3 text-left">Leadlar</th>
                          <th className="px-4 py-3 text-left">Buyurtmalar</th>
                          <th className="px-4 py-3 text-left">Daromad (so‘m)</th>
                          <th className="px-4 py-3 text-left">Payout (so‘m)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {trends.daily.leads.map((item, index) => (
                          <tr key={item.date} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 text-slate-700">
                              {new Intl.DateTimeFormat('uz-UZ', {
                                day: '2-digit',
                                month: 'short',
                              }).format(new Date(item.date))}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {item.value}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {trends.daily.orders[index]?.value ?? 0}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {(trends.daily.revenue[index]?.value ?? 0).toLocaleString('uz-UZ')}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {(trends.daily.payouts[index]?.value ?? 0).toLocaleString('uz-UZ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>Operator performansi</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3 text-left">Operator</th>
                          <th className="px-4 py-3 text-left">Qabul</th>
                          <th className="px-4 py-3 text-left text-emerald-700">Yetkazilgan</th>
                          <th className="px-4 py-3 text-left text-rose-600">Qaytgan</th>
                          <th className="px-4 py-3 text-left">Konversiya</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {trends.operatorHeatmap.map((operator) => (
                          <tr key={operator.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {operator.name}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{operator.total}</td>
                            <td className="px-4 py-3 text-emerald-700">
                              {operator.delivered}
                            </td>
                            <td className="px-4 py-3 text-rose-600">
                              {operator.returned}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  operator.progress >= 70
                                    ? 'secondary'
                                    : operator.progress >= 40
                                      ? 'outline'
                                      : 'destructive'
                                }
                              >
                                {operator.progress.toFixed(1)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {trends.operatorHeatmap.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-6 text-center text-sm text-slate-500"
                            >
                              Operator ma’lumotlari topilmadi.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </section>
            ) : null}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Analitika ma’lumotlari mavjud emas.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminAnalyticsPage;
