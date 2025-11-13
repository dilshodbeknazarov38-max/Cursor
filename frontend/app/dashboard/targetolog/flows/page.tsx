'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import FlowTable, { type FlowTableRow } from '@/components/FlowTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiDelete, apiGet, apiPut } from '@/lib/apiClient';
import type { Flow } from '@/types/flow';

const TargetologFlowsPage = () => {
  const { toast } = useToast();
  const [flows, setFlows] = useState<FlowTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadFlows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<Flow[]>('/flows/me');
      const mapped: FlowTableRow[] = response.map((flow) => ({
        id: flow.id,
        title: flow.title,
        slug: flow.slug,
        trackingUrl: flow.trackingUrl,
        clicks: flow.clicks,
        leads: flow.leads,
        orders: flow.orders,
        status: flow.status,
        createdAt: flow.createdAt,
        productTitle: flow.product?.title ?? 'Noma’lum mahsulot',
        product: flow.product ?? undefined,
      }));
      setFlows(mapped);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Oqimlar ro‘yxatini yuklab bo‘lmadi.';
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
    void loadFlows();
  }, [loadFlows]);

  const handleToggleStatus = useCallback(
    async (flow: FlowTableRow) => {
      setActionLoadingId(flow.id);
      const endpoint = flow.status === 'ACTIVE' ? `/flows/${flow.id}/pause` : `/flows/${flow.id}/activate`;
      try {
        await apiPut(endpoint);
        toast({
          title: flow.status === 'ACTIVE' ? 'Oqim to‘xtatildi' : 'Oqim faollashtirildi',
          description:
            flow.status === 'ACTIVE'
              ? `"${flow.title}" endi trafik qabul qilmaydi. Istalgan payt qayta faollashtiring.`
              : `"${flow.title}" yana trafik qabul qilmoqda. KPI ni kuzatib boring.`,
        });
        await loadFlows();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Oqim holatini o‘zgartirishda xatolik.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setActionLoadingId(null);
      }
    },
    [loadFlows, toast],
  );

  const handleDelete = useCallback(
    async (flow: FlowTableRow) => {
      const confirmed = window.confirm(`"${flow.title}" oqimini o‘chirishni tasdiqlaysizmi?`);
      if (!confirmed) {
        return;
      }
      setActionLoadingId(flow.id);
      try {
        await apiDelete(`/flows/${flow.id}`);
        toast({
          title: 'Oqim o‘chirildi',
          description: `"${flow.title}" ro‘yxatdan olib tashlandi.`,
        });
        await loadFlows();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Oqimni o‘chirishda xatolik.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setActionLoadingId(null);
      }
    },
    [loadFlows, toast],
  );

  return (
    <DashboardLayout role="targetolog">
      <div className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Oqimlarim</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tasdiqlangan mahsulotlar uchun yaratilgan oqimlarni kuzatib boring.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => loadFlows()} disabled={loading}>
              Yangilash
            </Button>
            <Button asChild>
              <Link href="/dashboard/targetolog/flows/new">Yangi oqim</Link>
            </Button>
          </div>
        </header>

        <FlowTable
          flows={flows}
          loading={loading}
          renderActions={(flow) => (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={actionLoadingId === flow.id}
                onClick={() => handleToggleStatus(flow)}
              >
                {flow.status === 'ACTIVE' ? 'To‘xtatish' : 'Faollashtirish'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="text-xs"
                disabled={actionLoadingId === flow.id}
                onClick={() => handleDelete(flow)}
              >
                O‘chirish
              </Button>
            </>
          )}
        />
      </div>
    </DashboardLayout>
  );
};

export default TargetologFlowsPage;
