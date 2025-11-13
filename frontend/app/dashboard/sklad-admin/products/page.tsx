'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import ProductTable, {
  type ProductTableRow,
} from '@/components/ProductTable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiGet, apiPut } from '@/lib/apiClient';

type ApiProduct = {
  id: string;
  title: string;
  description: string;
  price: string;
  status: string;
  stock: number;
  updatedAt: string;
  createdAt: string;
};

const SkladAdminPendingProductsPage = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<ApiProduct[]>('/products?status=PENDING');
      const mapped = response.map((product) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        status: product.status,
        stock: product.stock,
        updatedAt: product.updatedAt,
        createdAt: product.createdAt,
      }));
      setProducts(mapped);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Mahsulotlar ro‘yxatini yuklab bo‘lmadi.';
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

  const handleStatusChange = useCallback(
    async (id: string, action: 'approve' | 'reject') => {
      try {
        await apiPut(`/products/${id}/${action}`);
        toast({
          title: action === 'approve' ? 'Mahsulot tasdiqlandi' : 'Mahsulot rad etildi',
        });
        await loadProducts();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Amalni bajarib bo‘lmadi.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      }
    },
    [loadProducts, toast],
  );

  return (
    <DashboardLayout role="sklad-admin">
      <div className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Tasdiqlash kutilayotgan mahsulotlar
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Taminotchilar yuborgan yangi mahsulotlarni ko‘rib chiqing va qaror qabul qiling.
            </p>
          </div>
          <Button variant="outline" onClick={() => loadProducts()} disabled={loading}>
            Yangilash
          </Button>
        </header>

        <ProductTable
          products={products}
          loading={loading}
          emptyMessage="Hozircha tasdiqlash kutilayotgan mahsulot mavjud emas."
          renderActions={(product) => (
            <>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Link href={`/dashboard/sklad-admin/products/${product.id}`}>
                  Batafsil
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-emerald-700"
                onClick={() => handleStatusChange(product.id, 'approve')}
              >
                Tasdiqlash
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={() => handleStatusChange(product.id, 'reject')}
              >
                Rad etish
              </Button>
            </>
          )}
        />
      </div>
    </DashboardLayout>
  );
};

export default SkladAdminPendingProductsPage;
