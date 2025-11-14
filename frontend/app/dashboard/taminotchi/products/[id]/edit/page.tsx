'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import ProductForm, { type ProductPayload } from '@/components/ProductForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiGet, apiPut } from '@/lib/apiClient';

type TaminotchiEditProductPageProps = {
  params: {
    id: string;
  };
};

type ApiProduct = {
  id: string;
  title: string;
  description: string;
  price: string;
  images: string[];
  stock: number;
  status: string;
};

const TaminotchiEditProductPage = ({ params }: TaminotchiEditProductPageProps) => {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState<ApiProduct | null>(null);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<{ product: ApiProduct } | ApiProduct>(`/products/${id}`);
      const payload = 'product' in response ? response.product : response;
      setProduct(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Mahsulot tafsilotlarini yuklashda xatolik.';
      toast({
        title: 'Xatolik',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const handleSubmit = async (payload: ProductPayload) => {
    try {
      setSubmitting(true);
      await apiPut(`/products/${id}`, {
        title: payload.title,
        description: payload.description,
        price: payload.price,
        images: payload.images,
        stock: payload.stock,
      });

      toast({
        title: 'Mahsulot yangilandi',
        description: 'Mahsulot ma’lumotlari muvaffaqiyatli tahrirlandi.',
      });
      router.push('/dashboard/taminotchi/products');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Mahsulotni tahrirlashda xatolik.';
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
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Mahsulotni tahrirlash</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tasdiqlash holati PENDING bo‘lgan mahsulotni o‘zgartirishingiz mumkin.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Ortga qaytish
          </Button>
        </header>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm">
            Ma’lumotlar yuklanmoqda...
          </div>
        ) : product ? (
          product.status !== 'PENDING' ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm">
              Mahsulot holati <span className="font-semibold">{product.status}</span>. Faqat
              <span className="font-semibold"> PENDING</span> holatdagi mahsulotlar tahrirlanadi.
            </div>
          ) : (
            <ProductForm
              defaultValues={{
                title: product.title,
                description: product.description,
                price: Number(product.price),
                images: product.images,
                stock: product.stock,
              }}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitLabel="Saqlash"
            />
          )
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-600 shadow-sm">
            Mahsulot ma’lumotlarini yuklab bo‘lmadi yoki mahsulot mavjud emas.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TaminotchiEditProductPage;
