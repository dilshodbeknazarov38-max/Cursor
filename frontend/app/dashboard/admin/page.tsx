import { useCallback, useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { apiGet } from '@/lib/apiClient';

type AdminOverview = {
  users: {
    total: number;
    active: number;
    blocked: number;
  };
  payouts: {
    pendingCount: number;
    pendingAmount: string;
    latest: Array<{
      id: string;
      amount: string;
      createdAt: string;
      user: { id: string; name: string } | null;
    }>;
  };
  orders: {
    packing: number;
    shipped: number;
    deliveredToday: number;
    returnedToday: number;
  };
  inventory: {
    lowStockCount: number;
    lowStockSamples: Array<{ id: string; title: string; stock: number; reserved: number }>;
  };
  recentOrders: Array<{
    id: string;
    status: string;
    updatedAt: string;
    product: { id: string; title: string } | null;
    targetolog: { id: string; name: string } | null;
    operator: { id: string; name: string } | null;
  }>;
};

const statusLabels: Record<string, { label: string; className: string }> = {
  PACKING: { label: 'Qadoqlanmoqda', className: 'bg-amber-100 text-amber-700' },
  SHIPPED: { label: 'Jo‘natilgan', className: 'bg-sky-100 text-sky-700' },
  DELIVERED: { label: 'Yetkazilgan', className: 'bg-emerald-100 text-emerald-700' },
  RETURNED: { label: 'Qaytgan', className: 'bg-rose-100 text-rose-700' },
};

const AdminDashboardPage = () => {
  const { toast } = useToast();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<AdminOverview>('/stats/admin/overview');
      setData(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Ma’lumotlarni yuklashda xatolik.';
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

  const summaryCards = useMemo(() => {
    if (!data) {
      return [];
    }
    return [
      {
        title: 'Foydalanuvchilar',
        value: data.users.total,
        detail: `${data.users.active} aktiv · ${data.users.blocked} bloklangan`,
      },
      {
        title: 'Kutilayotgan payoutlar',
        value: data.payouts.pendingCount,
        detail: `${Number(data.payouts.pendingAmount).toLocaleString('uz-UZ')} so‘m`,
      },
      {
        title: 'Bugun yetkazilgan',
        value: data.orders.deliveredToday,
        detail: `${data.orders.returnedToday} ta qaytish`,
      },
      {
        title: 'Past zaxira',
        value: data.inventory.lowStockCount,
        detail: 'Ombor nazorati zarur',
      },
    ];
  }, [data]);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Platforma boshqaruvi
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Foydalanuvchilar, buyurtmalar, payout va inventar bo‘yicha umumiy ko‘rsatkichlar.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadOverview()} disabled={loading}>
              Yangilash
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Ma’lumotlar yuklanmoqda...
          </div>
        ) : data ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <Card key={card.title} className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-slate-500">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{card.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Buyurtma oqimi</CardTitle>
                  <Badge variant="secondary">
                    Qadoqlash: {data.orders.packing} · Jo‘natilgan: {data.orders.shipped}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <p>
                    Bugun yetkazilgan buyurtmalar:{' '}
                    <span className="font-semibold text-slate-900">
                      {data.orders.deliveredToday}
                    </span>
                  </p>
                  <p>
                    Bugun qaytgan buyurtmalar:{' '}
                    <span className="font-semibold text-rose-600">
                      {data.orders.returnedToday}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Buyurtmalar holati ombor operatsiyalari bilan sinxronlashgan.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Payout kutilyapti</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    Tasdiqlash kutilayotgan payout so‘rovlari:{' '}
                    <span className="font-semibold text-slate-900">
                      {data.payouts.pendingCount} ta
                    </span>{' '}
                    ({Number(data.payouts.pendingAmount).toLocaleString('uz-UZ')} so‘m)
                  </p>
                  <ul className="mt-4 space-y-3 text-sm">
                    {data.payouts.latest.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">
                            {Number(item.amount).toLocaleString('uz-UZ')} so‘m
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Intl.DateTimeFormat('uz-UZ', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: 'short',
                            }).format(new Date(item.createdAt))}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {item.user?.name ?? 'Noma’lum foydalanuvchi'}
                        </p>
                      </li>
                    ))}
                    {data.payouts.latest.length === 0 ? (
                      <li className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        Kutilayotgan payout topilmadi.
                      </li>
                    ) : null}
                  </ul>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Oxirgi buyurtmalar</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Buyurtma</th>
                        <th className="px-4 py-3 text-left">Mahsulot</th>
                        <th className="px-4 py-3 text-left">Holat</th>
                        <th className="px-4 py-3 text-right">Yangilangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.recentOrders.map((order) => {
                        const status = statusLabels[order.status] ?? {
                          label: order.status,
                          className: 'bg-slate-100 text-slate-600',
                        };
                        return (
                          <tr key={order.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900">{order.id}</p>
                              <p className="text-xs text-slate-500">
                                Targetolog: {order.targetolog?.name ?? 'Noma’lum'}
                              </p>
                              <p className="text-xs text-slate-500">
                                Operator: {order.operator?.name ?? 'Noma’lum'}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {order.product?.title ?? 'Noma’lum'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-slate-500">
                              {new Intl.DateTimeFormat('uz-UZ', {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: 'short',
                              }).format(new Date(order.updatedAt))}
                            </td>
                          </tr>
                        );
                      })}
                      {data.recentOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-sm text-slate-500"
                          >
                            Buyurtmalar topilmadi.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Past zaxiradagi mahsulotlar</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Mahsulot</th>
                        <th className="px-4 py-3 text-left">Zaxira</th>
                        <th className="px-4 py-3 text-left">Rezerv</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.inventory.lowStockSamples.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">
                              {product.title}
                            </p>
                            <p className="text-xs text-slate-500">ID: {product.id}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-rose-600">
                            {product.stock}
                          </td>
                          <td className="px-4 py-3 text-slate-700">{product.reserved}</td>
                        </tr>
                      ))}
                      {data.inventory.lowStockSamples.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-6 text-center text-sm text-slate-500"
                          >
                            Past zaxiradagi mahsulotlar yo‘q.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </section>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            Ma’lumotlar topilmadi.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
