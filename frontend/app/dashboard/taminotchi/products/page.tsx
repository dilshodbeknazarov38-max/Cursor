'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import ProductTable, {
  type ProductTableRow,
} from '@/components/ProductTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiDelete, apiGet, apiPost } from '@/lib/apiClient';

type ApiProduct = {
  id: string;
  title: string;
  description: string;
  price: string;
  status: string;
  stock: number;
  reservedStock?: number;
  updatedAt: string;
  createdAt: string;
};

const TaminotchiProductsPage = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<ApiProduct[]>('/products/me');
      const mapped = response.map((product) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        status: product.status,
        stock: product.stock,
        reservedStock: product.reservedStock ?? 0,
        updatedAt: product.updatedAt,
        createdAt: product.createdAt,
      }));
      setProducts(mapped);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Mahsulotlarni yuklashda xatolik.';
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
    void loadProducts();
  }, [loadProducts]);

    const handleAdjustStock = useCallback(
      async (product: ProductTableRow) => {
        const input = window.prompt(
          `"${product.title}" uchun zaxira o‘zgarishini kiriting (masalan, +10 yoki -3):`,
        );
        if (!input) {
          return;
        }
        const trimmed = input.trim();
        const matched = /^([+-]?\d+)$/.exec(trimmed);
        if (!matched) {
          toast({
            title: 'Noto‘g‘ri format',
            description: 'Faqat butun son kiriting. Masalan: +5 yoki -3.',
            variant: 'destructive',
          });
          return;
        }
        const value = Number(matched[1]);
        if (value === 0) {
          toast({
            title: 'Ma’lumot kiritilmadi',
            description: '0 ga teng o‘zgarish kiritilmaydi.',
            variant: 'destructive',
          });
          return;
        }
        const type: 'increase' | 'decrease' = value > 0 ? 'increase' : 'decrease';
        const payload = {
          productId: product.id,
          type,
          quantity: Math.abs(value),
          reason: 'Taminotchi tomonidan zaxira yangilandi',
        };
        try {
          await apiPost('/warehouse/adjust', payload);
          toast({
            title: 'Zaxira yangilandi',
            description: `"${product.title}" uchun zaxira muvaffaqiyatli o‘zgartirildi.`,
          });
          await loadProducts();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Zaxirani o‘zgartirishda xatolik.';
          toast({
            title: 'Xatolik',
            description: message,
            variant: 'destructive',
          });
        }
      },
      [loadProducts, toast],
    );

  const handleDelete = useCallback(
    async (id: string) => {
      const target = products.find((item) => item.id === id);
      if (!target) {
        return;
      }
      const confirmed = window.confirm(
        `"${target.title}" mahsulotini o‘chirishni tasdiqlaysizmi?`,
      );
      if (!confirmed) {
        return;
      }
      try {
        await apiDelete(`/products/${id}`);
        toast({
          title: 'Mahsulot o‘chirildi',
          description: `"${target.title}" ro‘yxatdan olib tashlandi.`,
        });
        await loadProducts();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Mahsulotni o‘chirishda xatolik.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      }
    },
    [loadProducts, products, toast],
  );

  return (
    <DashboardLayout role="taminotchi">
      <div className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Mahsulotlarim</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tasdiqlash jarayonidagi va faol mahsulotlarni kuzatib boring.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => loadProducts()} disabled={loading}>
              Yangilash
            </Button>
            <Button asChild>
              <Link href="/dashboard/taminotchi/products/new">Yangi mahsulot</Link>
            </Button>
          </div>
        </header>

        <ProductTable
          products={products}
          loading={loading}
          emptyMessage="Hozircha mahsulot qo‘shilmagan. Boshlash uchun “Yangi mahsulot” tugmasini bosing."
          renderActions={(product) => (
            <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleAdjustStock(product)}
                >
                  Zaxira
                </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Link href={`/dashboard/taminotchi/products/${product.id}/edit`}>
                  Tahrirlash
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={() => handleDelete(product.id)}
              >
                O‘chirish
              </Button>
            </>
          )}
        />
      </div>
    </DashboardLayout>
  );
};

export default TaminotchiProductsPage;
