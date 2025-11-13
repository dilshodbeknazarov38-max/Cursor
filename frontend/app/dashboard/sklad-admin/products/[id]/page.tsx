'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { apiGet, apiPut } from '@/lib/apiClient';

type PageProps = {
  params: {
    id: string;
  };
};

type ApiProduct = {
  id: string;
  title: string;
  description: string;
  price: string;
  status: string;
  stock: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    nickname: string;
    phone: string;
  };
};

const SkladAdminProductDetailPage = ({ params }: PageProps) => {
  const { id } = params;
  const { toast } = useToast();
  const router = useRouter();

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
        error instanceof Error ? error.message : 'Mahsulot tafsilotlarini yuklab bo‘lmadi.';
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

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!product) {
      return;
    }
    try {
      setSubmitting(true);
      await apiPut(`/products/${product.id}/${action}`);
      toast({
        title: action === 'approve' ? 'Mahsulot tasdiqlandi' : 'Mahsulot rad etildi',
      });
      router.push('/dashboard/sklad-admin/products');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Amalni bajarib bo‘lmadi.';
      toast({
        title: 'Xatolik',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="sklad-admin">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm">
          Ma’lumotlar yuklanmoqda...
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout role="sklad-admin">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-600 shadow-sm">
          Mahsulot topilmadi yoki unga kirish huquqi mavjud emas.
        </div>
      </DashboardLayout>
    );
  }

  const ownerName = product.owner
    ? `${product.owner.firstName ?? ''} ${product.owner.lastName ?? ''}`.trim() ||
      product.owner.nickname
    : 'Noma’lum';

  return (
    <DashboardLayout role="sklad-admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{product.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Mahsulot holati: <span className="font-medium">{product.status}</span>
            </p>
          </div>
          <div className="flex gap-3">
            {product.status === 'PENDING' ? (
              <>
                <Button
                  variant="outline"
                  disabled={submitting}
                  onClick={() => handleAction('approve')}
                >
                  Tasdiqlash
                </Button>
                <Button
                  variant="destructive"
                  disabled={submitting}
                  onClick={() => handleAction('reject')}
                >
                  Rad etish
                </Button>
              </>
            ) : null}
            <Button variant="outline" onClick={() => router.back()}>
              Ortga
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mahsulot tafsilotlari</CardTitle>
            <CardDescription>
              Taminotchi: {ownerName} · {product.owner?.phone ?? 'Telefon mavjud emas'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-700">Tavsif</h3>
              <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Narx
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {new Intl.NumberFormat('uz-UZ', {
                    style: 'currency',
                    currency: 'UZS',
                    maximumFractionDigits: 0,
                  }).format(Number(product.price))}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Ombordagi soni
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{product.stock}</p>
              </div>
            </div>

            {product.images.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Rasmlar
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  {product.images.map((imageUrl) => (
                    <a
                      key={imageUrl}
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 hover:border-slate-300"
                    >
                      {imageUrl}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SkladAdminProductDetailPage;
