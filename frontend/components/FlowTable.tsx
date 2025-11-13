'use client';

import { ReactNode } from 'react';

type FlowTableRow = {
  id: string;
  title: string;
  urlSlug: string;
  productTitle: string;
  createdAt: string;
  isActive: boolean;
};

type FlowTableProps = {
  flows: FlowTableRow[];
  loading?: boolean;
  emptyMessage?: string;
  renderActions?: (flow: FlowTableRow) => ReactNode;
};

const FlowTable = ({
  flows,
  loading = false,
  emptyMessage = 'Hozircha oqimlar mavjud emas.',
  renderActions,
}: FlowTableProps) => {
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
            <th className="px-4 py-3 text-left">Oqim nomi</th>
            <th className="px-4 py-3 text-left">Mahsulot</th>
            <th className="px-4 py-3 text-left">Slug</th>
            <th className="px-4 py-3 text-left">Yaratilgan</th>
            <th className="px-4 py-3 text-left">Holat</th>
            {renderActions ? <th className="px-4 py-3 text-right">Amallar</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {flows.map((flow) => (
            <tr key={flow.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-semibold text-slate-900">{flow.title}</td>
              <td className="px-4 py-3 text-slate-700">{flow.productTitle}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{flow.urlSlug}</td>
              <td className="px-4 py-3 text-slate-500">
                {new Intl.DateTimeFormat('uz-UZ', {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(flow.createdAt))}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                    flow.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {flow.isActive ? 'Faol' : 'O‘chirilgan'}
                </span>
              </td>
              {renderActions ? (
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {renderActions(flow)}
                  </div>
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
