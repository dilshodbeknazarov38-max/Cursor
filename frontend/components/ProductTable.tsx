'use client';

import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ProductTableRow = {
  id: string;
  title: string;
  description?: string;
  price: string;
  status: string;
  stock: number;
  updatedAt: string;
  createdAt: string;
};

type ProductTableProps = {
  products: ProductTableRow[];
  loading?: boolean;
  emptyMessage?: string;
  renderActions?: (product: ProductTableRow) => ReactNode;
};

const statusClasses: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const ProductTable = ({
  products,
  loading = false,
  emptyMessage = 'Mahsulotlar topilmadi.',
  renderActions,
}: ProductTableProps) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm">
        Ma’lumotlar yuklanmoqda...
      </div>
    );
  }

  if (!products.length) {
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
            <th className="px-4 py-3 text-left">Mahsulot</th>
            <th className="px-4 py-3 text-left">Narx</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Soni</th>
            <th className="px-4 py-3 text-left">Yangilangan</th>
            {renderActions ? <th className="px-4 py-3 text-right">Amallar</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{product.title}</p>
                  {product.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {product.description}
                    </p>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-slate-800">
                {new Intl.NumberFormat('uz-UZ', {
                  style: 'currency',
                  currency: 'UZS',
                  maximumFractionDigits: 0,
                }).format(Number(product.price))}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
                    statusClasses[product.status] ?? 'bg-slate-100 text-slate-600',
                  )}
                >
                  {product.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-700">{product.stock}</td>
              <td className="px-4 py-3 text-slate-500">
                {new Intl.DateTimeFormat('uz-UZ', {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(product.updatedAt))}
              </td>
              {renderActions ? (
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {renderActions(product)}
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

export type { ProductTableProps, ProductTableRow };
export default ProductTable;
