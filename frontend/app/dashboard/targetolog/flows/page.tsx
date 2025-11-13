'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import FlowTable, { type FlowTableRow } from '@/components/FlowTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiDelete, apiGet } from '@/lib/apiClient';

type ApiFlow = {
  id: string;
  title: string;
  urlSlug: string;
  isActive: boolean;
  createdAt: string;
  product: {
    id: string;
    title: string;
  };
};

const TargetologFlowsPage = () => {
  const { toast } = useToast();
  const [flows, setFlows] = useState<FlowTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFlows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<ApiFlow[]>('/flows/me');
      const mapped = response.map((flow) => ({
        id: flow.id,
        title: flow.title,
        urlSlug: flow.urlSlug,
        productTitle: flow.product?.title ?? 'Noma’lum mahsulot',
        createdAt: flow.createdAt,
        isActive: flow.isActive,
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

  const handleDelete = useCallback(
    async (id: string) => {
      const flow = flows.find((item) => item.id === id);
      if (!flow) {
        return;
      }
      const confirmed = window.confirm(
        `"${flow.title}" oqimini o‘chirishni tasdiqlaysizmi?`,
      );
      if (!confirmed) {
        return;
      }
      try {
        await apiDelete(`/flows/${id}`);
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
      }
    },
    [flows, loadFlows, toast],
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
            <Button
              variant="destructive"
              size="sm"
              className="text-xs"
              onClick={() => handleDelete(flow.id)}
            >
              O‘chirish
            </Button>
          )}
        />
      </div>
    </DashboardLayout>
  );
};

export default TargetologFlowsPage;
