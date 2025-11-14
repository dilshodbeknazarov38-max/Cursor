'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import FlowForm, { type FlowFormProduct, type FlowFormValues } from '@/components/FlowForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiGet, apiPost } from '@/lib/apiClient';
import type { Flow } from '@/types/flow';

type ApiApprovedProduct = {
  id: string;
  title: string;
  price: string;
};

const TargetologCreateFlowPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<FlowFormProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await apiGet<ApiApprovedProduct[]>('/products/approved');
        const mapped = response.map((product) => ({
          id: product.id,
          title: product.title,
          price: product.price,
        }));
        setProducts(mapped);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Tasdiqlangan mahsulotlarni yuklab bo‘lmadi.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchProducts();
  }, [toast]);

  const handleSubmit = async (payload: FlowFormValues): Promise<Flow> => {
    const response = await apiPost<Flow, FlowFormValues>('/flows', payload);
    return response;
  };

  return (
    <DashboardLayout role="targetolog">
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Yangi oqim</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tasdiqlangan mahsulotni tanlang, qisqa slug kiriting va tracking havolani oling.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Ortga
          </Button>
        </header>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm">
            Ma’lumotlar yuklanmoqda...
          </div>
        ) : products.length ? (
          <FlowForm products={products} onSubmit={handleSubmit} />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm">
            Tasdiqlangan mahsulotlar mavjud emas. Avval ombor tomonidan mahsulot tasdiqlanishi kerak.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TargetologCreateFlowPage;