'use client';

import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

type ProductPayload = {
  title: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
};

type ProductFormProps = {
  defaultValues?: Partial<ProductPayload>;
  submitLabel?: string;
  submitting?: boolean;
  onSubmit: (payload: ProductPayload) => Promise<void> | void;
};

const toArrayFromMultiline = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const ProductForm = ({
  defaultValues,
  submitLabel = 'Saqlash',
  submitting = false,
  onSubmit,
}: ProductFormProps) => {
  const [title, setTitle] = useState(defaultValues?.title ?? '');
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [priceInput, setPriceInput] = useState(
    defaultValues?.price !== undefined ? String(defaultValues.price) : '',
  );
  const [imagesInput, setImagesInput] = useState(
    (defaultValues?.images ?? []).join('\n'),
  );
  const [stockInput, setStockInput] = useState(
    defaultValues?.stock !== undefined ? String(defaultValues.stock) : '0',
  );
  const [error, setError] = useState<string | null>(null);

  const parsedPrice = useMemo(() => Number(priceInput), [priceInput]);
  const parsedStock = useMemo(() => Number(stockInput), [stockInput]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Mahsulot nomi majburiy.');
      return;
    }
    if (!description.trim()) {
      setError('Mahsulot tavsifi majburiy.');
      return;
    }
    if (!priceInput || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Narx musbat son bo‘lishi kerak.');
      return;
    }
    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      setError('Soni 0 dan kichik bo‘lishi mumkin emas.');
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      price: Number(parsedPrice.toFixed(2)),
      images: toArrayFromMultiline(imagesInput),
      stock: Math.floor(parsedStock),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Mahsulot ma’lumotlari</h3>
        <p className="mt-1 text-sm text-slate-500">
          Nom, narx va tavsifni kiriting. Tasdiqlash jarayonida bu ma’lumotlar asos qilinadi.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="product-title" className="text-sm font-medium text-slate-700">
            Mahsulot nomi
          </label>
          <Input
            id="product-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Masalan, Premium Vitamin C"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="product-price" className="text-sm font-medium text-slate-700">
            Narxi (UZS)
          </label>
          <Input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            required
            value={priceInput}
            onChange={(event) => setPriceInput(event.target.value)}
            placeholder="125000"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="product-stock" className="text-sm font-medium text-slate-700">
            Ombordagi soni
          </label>
          <Input
            id="product-stock"
            type="number"
            min="0"
            value={stockInput}
            onChange={(event) => setStockInput(event.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="product-images" className="text-sm font-medium text-slate-700">
            Rasm URL lar (har satrda bittadan)
          </label>
          <Textarea
            id="product-images"
            rows={3}
            value={imagesInput}
            onChange={(event) => setImagesInput(event.target.value)}
            placeholder="https://cdn.example.com/main.jpg"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-description" className="text-sm font-medium text-slate-700">
          Tavsif
        </label>
        <Textarea
          id="product-description"
          rows={5}
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Mahsulot haqida batafsil ma’lumot..."
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saqlanmoqda...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export type { ProductPayload, ProductFormProps };
export default ProductForm;
