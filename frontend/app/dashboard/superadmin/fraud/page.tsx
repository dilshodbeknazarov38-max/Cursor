'use client';

import { useCallback, useEffect, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { apiGet } from '@/lib/apiClient';

type FraudOverview = {
  summary: {
    duplicatePhones: number;
    suspiciousIps: number;
    sharedCards: number;
    highValueTransactions: number;
    fastCancelledLeads: number;
    openFraudFlags: number;
  };
  duplicatePhones: Array<{
    phone: string;
    count: number;
    leads: Array<{
      id: string;
      phone: string;
      createdAt: string;
      sourceIp: string | null;
      flow?: { id: string; title: string } | null;
      targetolog?: { id: string; firstName: string | null; nickname: string } | null;
    }>;
  }>;
  suspiciousIps: Array<{
    ip: string;
    count: number;
    leads: Array<{
      id: string;
      phone: string;
      createdAt: string;
      sourceIp: string | null;
      flow?: { id: string; title: string } | null;
    }>;
  }>;
  sharedCards: Array<{
    cardNumber: string;
    count: number;
    payouts: Array<{
      id: string;
      status: string;
      amount: number;
      createdAt: string;
      user: { id: string; name: string; phone: string | null } | null;
    }>;
  }>;
  highValueTransactions: Array<{
    id: string;
    createdAt: string;
    amount: number;
    type: string;
    user: { id: string; name: string; phone: string | null } | null;
  }>;
  fastCancelledLeads: Array<{
    id: string;
    phone: string;
    lifetimeMs: number;
    sourceIp: string | null;
    flow: { id: string; title: string } | null;
  }>;
  openFraudChecks: Array<{
    id: string;
    createdAt: string;
    reason: string;
    status: string;
    metadata: unknown;
    user: { id: string; firstName: string | null; nickname: string; phone: string | null } | null;
  }>;
  metadata: {
    lookbackDays: number;
  };
};

const FraudsPage = () => {
  const { toast } = useToast();
  const [overview, setOverview] = useState<FraudOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<FraudOverview>('/admin/fraud/overview');
      setOverview(response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Fraud ma’lumotlarini yuklashda xatolik.';
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
    void loadOverview();
  }, [loadOverview]);

  const summaryItems = [
    {
      label: 'Dublikat telefonlar',
      value: overview?.summary.duplicatePhones ?? 0,
      annotation: 'Bir xil raqamdan kelgan leadlar',
      variant: 'destructive' as const,
    },
    {
      label: 'Shubhali IP',
      value: overview?.summary.suspiciousIps ?? 0,
      annotation: 'Bir IP dan yuqori faollik',
      variant: 'outline' as const,
    },
    {
      label: 'Bo‘lishilgan kartalar',
      value: overview?.summary.sharedCards ?? 0,
      annotation: 'Bir nechta user ishlatgan karta',
      variant: 'secondary' as const,
    },
    {
      label: 'Yuqori tranzaksiyalar',
      value: overview?.summary.highValueTransactions ?? 0,
      annotation: 'Chegara summadan yuqori operatsiya',
      variant: 'outline' as const,
    },
    {
      label: 'Tez rad etilgan leadlar',
      value: overview?.summary.fastCancelledLeads ?? 0,
      annotation: '5 daqiqada bekor qilingan leadlar',
      variant: 'outline' as const,
    },
    {
      label: 'Faol fraud tekshiruvlari',
      value: overview?.summary.openFraudFlags ?? 0,
      annotation: 'Yopilmagan fraud tekshiruvlari',
      variant: 'secondary' as const,
    },
  ];

  return (
    <DashboardLayout role="superadmin">
      <div className="space-y-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Fraud monitoring</h1>
            <p className="mt-1 text-sm text-slate-500">
              Telefon, IP, karta va tranzaksiyalar bo‘yicha shubhali faollikni kuzating.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadOverview()} disabled={loading}>
              Yangilash
            </Button>
            {overview ? (
              <Badge variant="outline">
                Oxirgi {overview.metadata.lookbackDays} kun
              </Badge>
            ) : null}
          </div>
        </header>

        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Ma’lumotlar yuklanmoqda...
          </div>
        ) : overview ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {summaryItems.map((item) => (
                <Card key={item.label} className="border border-slate-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-semibold text-slate-500">
                      {item.label}
                    </CardTitle>
                    <Badge variant={item.variant}>{item.value}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-500">{item.annotation}</p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Dublikat telefonlar</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Telefon</th>
                        <th className="px-4 py-3 text-left">Leadlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {overview.duplicatePhones.map((entry) => (
                        <tr key={entry.phone} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {entry.phone}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <div className="space-y-2">
                              <p className="text-xs text-slate-500">
                                Jami {entry.count} ta lead
                              </p>
                              <ul className="space-y-1 text-xs text-slate-500">
                                {entry.leads.map((lead) => (
                                  <li key={lead.id} className="rounded bg-slate-50 px-3 py-2">
                                    <div className="flex items-center justify-between">
                                      <span>
                                        {new Intl.DateTimeFormat('uz-UZ', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          day: '2-digit',
                                          month: 'short',
                                        }).format(new Date(lead.createdAt))}
                                      </span>
                                      <span>
                                        {lead.flow?.title ?? 'Flow noma’lum'}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                                      <span>IP: {lead.sourceIp ?? '-'}</span>
                                      <span>
                                        Targetolog:{' '}
                                        {lead.targetolog
                                          ? `${lead.targetolog.firstName ?? ''} (${lead.targetolog.nickname})`
                                          : 'Aniqlanmagan'}
                                      </span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {overview.duplicatePhones.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-6 text-center text-sm text-slate-500"
                          >
                            Telefon raqamlar bo‘yicha dublikat topilmadi.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Shubhali IP manzillar</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">IP manzil</th>
                        <th className="px-4 py-3 text-left">Leadlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {overview.suspiciousIps.map((entry) => (
                        <tr key={entry.ip} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {entry.ip}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <p className="text-xs text-slate-500">
                              Jami {entry.count} ta lead
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-slate-500">
                              {entry.leads.map((lead) => (
                                <li key={lead.id} className="rounded bg-slate-50 px-3 py-2">
                                  <div className="flex items-center justify-between">
                                    <span>{lead.phone}</span>
                                    <span>
                                      {new Intl.DateTimeFormat('uz-UZ', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        day: '2-digit',
                                        month: 'short',
                                      }).format(new Date(lead.createdAt))}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[11px] text-slate-400">
                                    Flow: {lead.flow?.title ?? 'Aniqlanmagan'}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                      {overview.suspiciousIps.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-6 text-center text-sm text-slate-500"
                          >
                            Shubhali IP manzillar topilmadi.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Bo‘lishilgan kartalar</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Karta</th>
                        <th className="px-4 py-3 text-left">Payoutlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {overview.sharedCards.map((card) => (
                        <tr key={card.cardNumber} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {card.cardNumber}
                            <p className="text-xs text-slate-500">
                              Jami {card.count} ta payout
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <ul className="space-y-1 text-xs text-slate-500">
                              {card.payouts.map((payout) => (
                                <li key={payout.id} className="rounded bg-slate-50 px-3 py-2">
                                  <div className="flex items-center justify-between">
                                    <span>{payout.user?.name ?? 'Noma’lum user'}</span>
                                    <span className="font-medium text-slate-900">
                                      {payout.amount.toLocaleString('uz-UZ')} so‘m
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                                    <span>Status: {payout.status}</span>
                                    <span>
                                      {new Intl.DateTimeFormat('uz-UZ', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        day: '2-digit',
                                        month: 'short',
                                      }).format(new Date(payout.createdAt))}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                      {overview.sharedCards.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-6 text-center text-sm text-slate-500"
                          >
                            Bo‘lishilgan kartalar aniqlanmadi.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Yuqori tranzaksiyalar & tez bekor qilingan leadlar</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Yuqori tranzaksiyalar
                    </p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {overview.highValueTransactions.map((transaction) => (
                        <li key={transaction.id} className="rounded-lg bg-slate-50 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">
                              {transaction.amount.toLocaleString('uz-UZ')} so‘m
                            </span>
                            <span className="text-xs text-slate-500">{transaction.type}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {transaction.user?.name ?? 'Noma’lum user'} ·{' '}
                            {new Intl.DateTimeFormat('uz-UZ', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: 'short',
                            }).format(new Date(transaction.createdAt))}
                          </p>
                        </li>
                      ))}
                      {overview.highValueTransactions.length === 0 ? (
                        <li className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          Limitdan yuqori tranzaksiyalar mavjud emas.
                        </li>
                      ) : null}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Tez bekor qilingan leadlar
                    </p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      {overview.fastCancelledLeads.map((lead) => (
                        <li key={lead.id} className="rounded-lg bg-slate-50 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{lead.phone}</span>
                            <span className="text-xs text-slate-500">
                              {(lead.lifetimeMs / 1000).toFixed(0)} s
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            Flow: {lead.flow?.title ?? 'Aniqlanmagan'} · IP:{' '}
                            {lead.sourceIp ?? '-'}
                          </p>
                        </li>
                      ))}
                      {overview.fastCancelledLeads.length === 0 ? (
                        <li className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                          Tez bekor qilingan leadlar aniqlanmadi.
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Faol fraud tekshiruvlari</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    Balans tranzaksiyalari bo‘yicha ochilgan tekshiruvlar.
                  </p>
                </div>
                <Badge variant="outline">{overview.openFraudChecks.length} ta</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Foydalanuvchi</th>
                      <th className="px-4 py-3 text-left">Sabab</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Yaratilgan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview.openFraudChecks.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {item.user
                              ? `${item.user.firstName ?? ''} (${item.user.nickname})`
                              : 'Noma’lum user'}
                          </p>
                          <p className="text-xs text-slate-500">{item.user?.phone ?? '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{item.reason}</td>
                        <td className="px-4 py-3 text-slate-700">{item.status}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Intl.DateTimeFormat('uz-UZ', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short',
                          }).format(new Date(item.createdAt))}
                        </td>
                      </tr>
                    ))}
                    {overview.openFraudChecks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-center text-sm text-slate-500"
                        >
                          Faol fraud tekshiruvlari mavjud emas.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Fraud ma’lumotlari topilmadi.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FraudsPage;
