'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import ProductForm, { type ProductPayload } from '@/components/ProductForm';
import { useToast } from '@/components/ui/use-toast';
import { apiPost } from '@/lib/apiClient';

const TaminotchiCreateProductPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload: ProductPayload) => {
    try {
      setSubmitting(true);
      await apiPost('/products', {
        title: payload.title,
        description: payload.description,
        price: payload.price,
        images: payload.images,
        stock: payload.stock,
      });

      toast({
        title: 'Mahsulot yaratildi',
        description: 'Mahsulot maqomi "PENDING" holatida, ombor tasdiqlashini kuting.',
      });
      router.push('/dashboard/taminotchi/products');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Mahsulotni yaratishda xatolik.';
      toast({
        title: 'Xatolik',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="taminotchi">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Yangi mahsulot</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mahsulot ma’lumotlarini to‘ldiring va tasdiqlashga yuboring.
          </p>
        </header>

        <ProductForm onSubmit={handleSubmit} submitting={submitting} submitLabel="Saqlash" />
      </div>
    </DashboardLayout>
  );
};

export default TaminotchiCreateProductPage;
