'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import ProductTable, {
  type ProductTableRow,
} from '@/components/ProductTable';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { apiGet } from '@/lib/apiClient';

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

const statusFilters = [
  { value: 'ALL', label: 'Barcha' },
  { value: 'PENDING', label: 'Kutilayotgan' },
  { value: 'APPROVED', label: 'Tasdiqlangan' },
  { value: 'REJECTED', label: 'Rad etilgan' },
];

const SkladAdminAllProductsPage = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const loadProducts = useCallback(
    async (status: string) => {
      setLoading(true);
      try {
        const endpoint =
          status === 'ALL' ? '/products' : `/products?status=${encodeURIComponent(status)}`;
        const response = await apiGet<ApiProduct[]>(endpoint);
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
    },
    [toast],
  );

  useEffect(() => {
    void loadProducts(filter);
  }, [loadProducts, filter]);

  return (
    <DashboardLayout role="sklad-admin">
      <div className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Barcha mahsulotlar</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tasdiqlangan va rad etilgan mahsulotlar tarixi.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="w-40"
            >
              {statusFilters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={() => loadProducts(filter)} disabled={loading}>
              Yangilash
            </Button>
          </div>
        </header>

        <ProductTable
          products={products}
          loading={loading}
          emptyMessage="Kiritilgan filtr bo‘yicha mahsulot topilmadi."
          renderActions={(product) => (
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href={`/dashboard/sklad-admin/products/${product.id}`}>Batafsil</Link>
            </Button>
          )}
        />
      </div>
    </DashboardLayout>
  );
};

export default SkladAdminAllProductsPage;
