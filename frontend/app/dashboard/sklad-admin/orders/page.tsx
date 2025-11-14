'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { apiGet, apiPut } from '@/lib/apiClient';
import type { Order, OrderStatus } from '@/types/order';

const statusLabels: Record<OrderStatus, string> = {
  PACKING: 'Qadoqlash',
  SHIPPED: 'Yo‘lda',
  DELIVERED: 'Yetkazilgan',
  RETURNED: 'Qaytarilgan',
};

const statusStyles: Record<OrderStatus, string> = {
  PACKING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  RETURNED: 'bg-rose-100 text-rose-700',
};

const statusFilterOptions: Array<{ value: '' | OrderStatus; label: string }> = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'PACKING', label: 'Qadoqlash' },
  { value: 'SHIPPED', label: 'Yo‘lda' },
  { value: 'DELIVERED', label: 'Yetkazilgan' },
  { value: 'RETURNED', label: 'Qaytarilgan' },
];

const SkladOrdersPage = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'' | OrderStatus>('');
  const [actionId, setActionId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : '';
      const response = await apiGet<Order[]>(`/orders${query}`);
      setOrders(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Buyurtmalarni yuklab bo‘lmadi.';
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
    void loadOrders();
  }, [loadOrders]);

  const handleAction = useCallback(
    async (order: Order, action: 'pack' | 'ship' | 'deliver' | 'return') => {
      const endpoints: Record<typeof action, string> = {
        pack: `/orders/${order.id}/pack`,
        ship: `/orders/${order.id}/ship`,
        deliver: `/orders/${order.id}/deliver`,
        return: `/orders/${order.id}/return`,
      };
      const successMessages: Record<typeof action, string> = {
        pack: 'Buyurtma qadoqlandi.',
        ship: 'Buyurtma jo‘natildi.',
        deliver: 'Buyurtma yetkazildi.',
        return: 'Buyurtma qaytarildi.',
      };

      setActionId(order.id);
      try {
        await apiPut(endpoints[action]);
        toast({
          title: 'Amal bajarildi',
          description: successMessages[action],
        });
        await loadOrders();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Amalni bajarishda xatolik.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setActionId(null);
      }
    },
    [loadOrders, toast],
  );

  const stats = useMemo(() => {
    const total = orders.length;
    const shipped = orders.filter((order) => order.status === 'SHIPPED').length;
    const delivered = orders.filter((order) => order.status === 'DELIVERED').length;
    return { total, shipped, delivered };
  }, [orders]);

  return (
    <DashboardLayout role="sklad-admin">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Buyurtmalar oqimi</h1>
            <p className="mt-1 text-sm text-slate-500">
              Qadoqlash, jo‘natish va yetkazish jarayonlarini real vaqt rejimida boshqaring.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-3 sm:gap-4 sm:text-sm">
              <span>
                Jami: <span className="font-semibold text-slate-900">{stats.total}</span>
              </span>
              <span>
                Yo‘lda:{' '}
                <span className="font-semibold text-amber-700">{stats.shipped}</span>
              </span>
              <span>
                Yetkazilgan:{' '}
                <span className="font-semibold text-emerald-700">{stats.delivered}</span>
              </span>
            </div>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as '' | OrderStatus)}
            >
              {statusFilterOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={() => loadOrders()} disabled={loading}>
              Yangilash
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
            Ma’lumotlar yuklanmoqda...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
            Tanlangan filtr bo‘yicha buyurtmalar topilmadi.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Buyurtma</th>
                  <th className="px-4 py-3 text-left">Mahsulot</th>
                  <th className="px-4 py-3 text-left">Operator</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const canPack = order.status === 'PACKING';
                  const canShip = order.status === 'PACKING' && Boolean(order.packedAt);
                  const canDeliver = order.status === 'SHIPPED';
                  const canReturn =
                    order.status === 'PACKING' || order.status === 'SHIPPED';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">#{order.id.slice(0, 8)}</div>
                        <div className="text-xs text-slate-500">
                          {new Intl.DateTimeFormat('uz-UZ', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(order.createdAt))}
                        </div>
                        {order.lead ? (
                          <div className="mt-1 text-xs text-slate-500">
                            Mijoz: {order.lead.phone}{' '}
                            {order.lead.name ? `(${order.lead.name})` : ''}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{order.product?.title}</div>
                        <div className="text-xs text-slate-500">
                          Summa:{' '}
                          {new Intl.NumberFormat('uz-UZ', {
                            style: 'currency',
                            currency: 'UZS',
                            maximumFractionDigits: 0,
                          }).format(Number(order.amount))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {order.operator ? (
                          <>
                            <div className="font-medium text-slate-900">
                              {order.operator.nickname ?? order.operator.firstName ?? 'Operator'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {order.operator.phone ?? 'Telefon raqami mavjud emas'}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Operator biriktirilmagan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
                            statusStyles[order.status],
                          )}
                        >
                          {statusLabels[order.status]}
                        </span>
                        <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                          {order.packedAt ? (
                            <div>Qadoqlash: {new Date(order.packedAt).toLocaleString('uz-UZ')}</div>
                          ) : null}
                          {order.shippedAt ? (
                            <div>Jo‘natish: {new Date(order.shippedAt).toLocaleString('uz-UZ')}</div>
                          ) : null}
                          {order.deliveredAt ? (
                            <div>Yetkazish: {new Date(order.deliveredAt).toLocaleString('uz-UZ')}</div>
                          ) : null}
                          {order.returnedAt ? (
                            <div>Qaytarish: {new Date(order.returnedAt).toLocaleString('uz-UZ')}</div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canPack || actionId === order.id}
                            onClick={() => handleAction(order, 'pack')}
                          >
                            Qadoqlandi
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canShip || actionId === order.id}
                            onClick={() => handleAction(order, 'ship')}
                          >
                            Jo‘natildi
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            disabled={!canDeliver || actionId === order.id}
                            onClick={() => handleAction(order, 'deliver')}
                          >
                            Yetkazildi
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canReturn || actionId === order.id}
                            onClick={() => handleAction(order, 'return')}
                          >
                            Qaytarish
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
      </div>
    </DashboardLayout>
  );
};

export default SkladOrdersPage;
