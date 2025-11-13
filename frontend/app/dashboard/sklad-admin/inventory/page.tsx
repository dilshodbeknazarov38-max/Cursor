'use client';

import { useCallback, useEffect, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { apiGet, apiPost } from '@/lib/apiClient';

type InventoryItem = {
  id: string;
  title: string;
  status?: string;
  stock: number;
  reserved: number;
  updatedAt?: string;
  owner?: {
    id: string;
    name: string;
  } | null;
};

const SkladInventoryPage = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<InventoryItem[]>('/warehouse/inventory');
      setItems(response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Inventar ma’lumotlarini yuklashda xatolik.';
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
    void loadInventory();
  }, [loadInventory]);

  const handleAdjust = useCallback(
    async (item: InventoryItem, type: 'increase' | 'decrease') => {
      const promptLabel =
        type === 'increase'
          ? `"${item.title}" uchun qo‘shimcha zaxira miqdorini kiriting:`
          : `"${item.title}" uchun chiqariladigan zaxira miqdorini kiriting:`;
      const input = window.prompt(promptLabel);
      if (!input) {
        return;
      }
      const trimmed = input.trim();
      const matched = /^(\d+)$/.exec(trimmed);
      if (!matched) {
        toast({
          title: 'Noto‘g‘ri format',
          description: 'Faqat musbat butun son kiriting. Masalan: 5 yoki 12.',
          variant: 'destructive',
        });
        return;
      }
      const quantity = Number(matched[1]);
      if (quantity === 0) {
        toast({
          title: 'Ma’lumot kiritilmadi',
          description: '0 ga teng miqdor qabul qilinmaydi.',
          variant: 'destructive',
        });
        return;
      }

      try {
        await apiPost('/warehouse/adjust', {
          productId: item.id,
          type,
          quantity,
          reason:
            type === 'increase'
              ? 'Ombor zaxirasiga qo‘shimcha qo‘shildi'
              : 'Ombordan chiqarib yuborildi',
        });
        toast({
          title: 'Zaxira yangilandi',
          description: `"${item.title}" uchun inventar muvaffaqiyatli o‘zgartirildi.`,
        });
        await loadInventory();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Inventarni yangilashda xatolik.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      }
    },
    [loadInventory, toast],
  );

  const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
  const totalReserved = items.reduce((sum, item) => sum + item.reserved, 0);

  return (
    <DashboardLayout role="sklad-admin">
      <div className="space-y-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Ombor nazorati</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tasdiqlangan mahsulotlar bo‘yicha mavjud va rezervdagi zaxiralarni kuzating.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadInventory()} disabled={loading}>
              Yangilash
            </Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Umumiy zaxira</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{totalStock}</p>
              <p className="text-sm text-slate-500">Mahsulotlar bo‘yicha mavjud dona</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rezerv</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{totalReserved}</p>
              <p className="text-sm text-slate-500">Buyurtmalar uchun band qilingan dona</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Faol mahsulotlar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{items.length}</p>
              <p className="text-sm text-slate-500">Inventar ro‘yxatidagi mahsulotlar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Past zaxiralar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-red-600">
                {items.filter((item) => item.stock <= 5).length}
              </p>
              <p className="text-sm text-slate-500">Tezkor e’tibor talab etiladi</p>
            </CardContent>
          </Card>
        </section>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Mahsulot</th>
                <th className="px-4 py-3 text-left">Egasi</th>
                <th className="px-4 py-3 text-left">Mavjud</th>
                <th className="px-4 py-3 text-left">Rezerv</th>
                <th className="px-4 py-3 text-left">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-slate-500"
                    colSpan={5}
                  >
                    Ma’lumotlar yuklanmoqda...
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-slate-500"
                    colSpan={5}
                  >
                    Hozircha inventarda mahsulot mavjud emas.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">ID: {item.id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.owner?.name ?? 'Noma’lum'}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        item.stock <= 5 ? 'text-red-600' : 'text-slate-800'
                      }`}
                    >
                      {item.stock}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.reserved}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleAdjust(item, 'increase')}
                        >
                          +
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleAdjust(item, 'decrease')}
                        >
                            -
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SkladInventoryPage;
