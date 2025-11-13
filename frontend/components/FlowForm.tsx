'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

type FlowFormProduct = {
  id: string;
  title: string;
  price: string;
};

type FlowFormProps = {
  products: FlowFormProduct[];
  submitting?: boolean;
  onSubmit: (payload: { title: string; productId: string }) => Promise<void> | void;
};

const FlowForm = ({ products, submitting = false, onSubmit }: FlowFormProps) => {
  const [title, setTitle] = useState('');
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!products.length) {
      setProductId('');
      return;
    }
    const exists = products.some((product) => product.id === productId);
    if (!exists) {
      setProductId(products[0].id);
    }
  }, [productId, products]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Oqim nomi majburiy.');
      return;
    }
    if (!productId) {
      setError('Mahsulot tanlang.');
      return;
    }

    await onSubmit({
      title: title.trim(),
      productId,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Yangi oqim yaratish</h3>
        <p className="mt-1 text-sm text-slate-500">
          Tasdiqlangan mahsulotlardan birini tanlab, oqim nomini kiriting.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="flow-title" className="text-sm font-medium text-slate-700">
            Oqim nomi
          </label>
          <Input
            id="flow-title"
            value={title}
            required
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Masalan, Instagram CPA oqimi"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="flow-product" className="text-sm font-medium text-slate-700">
            Mahsulot
          </label>
          <Select
            id="flow-product"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title} ·{' '}
                {new Intl.NumberFormat('uz-UZ', {
                  style: 'currency',
                  currency: 'UZS',
                  maximumFractionDigits: 0,
                }).format(Number(product.price))}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={submitting || products.length === 0}>
          {submitting ? 'Yaratilmoqda...' : 'Oqim yaratish'}
        </Button>
      </div>
    </form>
  );
};

export type { FlowFormProps, FlowFormProduct };
export default FlowForm;
