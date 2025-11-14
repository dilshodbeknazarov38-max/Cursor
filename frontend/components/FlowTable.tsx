'use client';

import { ReactNode, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import type { Flow, FlowStatus } from '@/types/flow';

type FlowTableRow = Pick<
  Flow,
  'id' | 'title' | 'slug' | 'trackingUrl' | 'product' | 'clicks' | 'leads' | 'orders' | 'status' | 'createdAt'
> & {
  productTitle: string;
};

type FlowTableProps = {
  flows: FlowTableRow[];
  loading?: boolean;
  emptyMessage?: string;
  renderActions?: (flow: FlowTableRow) => ReactNode;
};

const statusStyles: Record<FlowStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAUSED: 'bg-amber-100 text-amber-700',
};

const FlowTable = ({
  flows,
  loading = false,
  emptyMessage = 'Hozircha oqimlar mavjud emas.',
  renderActions,
}: FlowTableProps) => {
  const { toast } = useToast();

  const handleCopy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast({
          title: 'Nusxa olindi',
          description: 'Tracking havola buferga nusxalandi.',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Nusxa olishda xatolik yuz berdi.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      }
    },
    [toast],
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm">
        Ma’lumotlar yuklanmoqda...
      </div>
    );
  }

  if (!flows.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Oqim</th>
            <th className="px-4 py-3 text-left">Tracking havola</th>
            <th className="px-4 py-3 text-left">Ko‘rsatkichlar</th>
            <th className="px-4 py-3 text-left">Holat</th>
            <th className="px-4 py-3 text-left">Yaratilgan</th>
            {renderActions ? <th className="px-4 py-3 text-right">Amallar</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {flows.map((flow) => (
            <tr key={flow.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-900">{flow.title}</div>
                <div className="text-xs text-slate-500">
                  Mahsulot: {flow.productTitle || flow.product?.title || 'Noma’lum'}
                </div>
                <div className="text-[11px] font-mono uppercase text-slate-400">Slug: {flow.slug}</div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <code className="inline-flex max-w-[220px] flex-1 truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {flow.trackingUrl}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-2 text-xs"
                    onClick={() => handleCopy(flow.trackingUrl)}
                  >
                    Nusxa
                  </Button>
                </div>
              </td>
              <td className="px-4 py-3">
                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded bg-slate-50 px-2 py-1 text-center">
                    <dt className="text-[10px] uppercase text-slate-400">Kliklar</dt>
                    <dd className="text-sm font-semibold text-slate-800">{flow.clicks}</dd>
                  </div>
                  <div className="rounded bg-slate-50 px-2 py-1 text-center">
                    <dt className="text-[10px] uppercase text-slate-400">Leadlar</dt>
                    <dd className="text-sm font-semibold text-slate-800">{flow.leads}</dd>
                  </div>
                  <div className="rounded bg-slate-50 px-2 py-1 text-center">
                    <dt className="text-[10px] uppercase text-slate-400">Buyurtmalar</dt>
                    <dd className="text-sm font-semibold text-slate-800">{flow.orders}</dd>
                  </div>
                </dl>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[flow.status]}`}
                >
                  {flow.status === 'ACTIVE' ? 'Faol' : 'To‘xtatilgan'}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {new Intl.DateTimeFormat('uz-UZ', {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(flow.createdAt))}
              </td>
              {renderActions ? (
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">{renderActions(flow)}</div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export type { FlowTableProps, FlowTableRow };
export default FlowTable;
