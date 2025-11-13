'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';

type ProductFormValues = {
  name: string;
  price: string;
  description: string;
};

type ProductFormProps = {
  onSubmit?: (values: ProductFormValues) => void;
};

const initialValues: ProductFormValues = {
  name: '',
  price: '',
  description: '',
};

const ProductForm = ({ onSubmit }: ProductFormProps) => {
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [status, setStatus] = useState<'idle' | 'submitted'>('idle');

  const handleChange = (field: keyof ProductFormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setStatus('idle');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('submitted');
    onSubmit?.(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Yangi mahsulot qo‘shish</h3>
        <p className="mt-1 text-sm text-slate-500">Taminotchi mahsulot ma’lumotlarini kiriting.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-name" className="text-sm font-medium text-slate-700">
          Mahsulot nomi
        </label>
        <input
          id="product-name"
          type="text"
          required
          value={values.name}
          onChange={handleChange('name')}
          placeholder="Masalan, Premium Vitamin C"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-price" className="text-sm font-medium text-slate-700">
          Narxi (UZS)
        </label>
        <input
          id="product-price"
          type="number"
          min="0"
          required
          value={values.price}
          onChange={handleChange('price')}
          placeholder="Masalan, 125000"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-description" className="text-sm font-medium text-slate-700">
          Tavsif
        </label>
        <textarea
          id="product-description"
          rows={4}
          required
          value={values.description}
          onChange={handleChange('description')}
          placeholder="Mahsulot haqida qisqacha ma’lumot..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {status === 'submitted' ? 'Mahsulot saqlashga tayyor.' : 'Formani to‘ldirib “Saqlash” tugmasini bosing.'}
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          Saqlash
        </button>
      </div>
    </form>
  );
};

export type { ProductFormValues, ProductFormProps };
export default ProductForm;
