'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiGet, apiPut } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import type { Lead, LeadStatus } from '@/types/lead';

const statusLabels: Record<LeadStatus, string> = {
  NEW: 'Yangi',
  ASSIGNED: 'Biriktirilgan',
  CALLBACK: 'Qayta aloqa',
  CONFIRMED: 'Tasdiqlangan',
  CANCELLED: 'Bekor qilingan',
};

const statusStyles: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  ASSIGNED: 'bg-amber-100 text-amber-700',
  CALLBACK: 'bg-purple-100 text-purple-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

const OperatorLeadsPage = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<Lead[]>('/leads/new');
      setLeads(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Leadlar ro‘yxatini yuklab bo‘lmadi.';
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
    void loadLeads();
  }, [loadLeads]);

  const handleAssign = useCallback(
    async (lead: Lead) => {
      setActionId(lead.id);
      try {
        await apiPut<Lead>(`/leads/${lead.id}/assign`);
        toast({
          title: 'Lead biriktirildi',
          description: `${lead.phone} raqamli lead sizga biriktirildi.`,
        });
        await loadLeads();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Leadni biriktirishda xatolik.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setActionId(null);
      }
    },
    [loadLeads, toast],
  );

  const handleCallback = useCallback(
    async (lead: Lead) => {
      const note = window.prompt('Qayta aloqa uchun eslatma (ixtiyoriy):', lead.notes ?? '');
      setActionId(lead.id);
      try {
        await apiPut<Lead>(`/leads/${lead.id}/callback`, { note: note ?? undefined });
        toast({
          title: 'Qayta aloqa',
          description: `${lead.phone} raqamli lead qayta aloqa navbatiga qo‘shildi.`,
        });
        await loadLeads();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Qayta aloqa rejimiga o‘tkazishda xatolik.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setActionId(null);
      }
    },
    [loadLeads, toast],
  );

  const handleCancel = useCallback(
    async (lead: Lead) => {
      const note = window.prompt('Bekor qilish sababi (ixtiyoriy):', '');
      if (note === null) {
        return;
      }
      setActionId(lead.id);
      try {
        await apiPut<Lead>(`/leads/${lead.id}/cancel`, { note: note ?? undefined });
        toast({
          title: 'Lead bekor qilindi',
          description: `${lead.phone} raqamli lead bekor qilindi.`,
        });
        await loadLeads();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Leadni bekor qilishda xatolik.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setActionId(null);
      }
    },
    [loadLeads, toast],
  );

  const handleConfirm = useCallback(
    async (lead: Lead) => {
      const confirm = window.confirm(
        `"${lead.phone}" raqamli lead bilan buyurtma yaratishni tasdiqlaysizmi?`,
      );
      if (!confirm) {
        return;
      }
      const note = window.prompt('Tasdiqlash uchun izoh (ixtiyoriy):', '');
      setActionId(lead.id);
      try {
        const response = await apiPut<{ lead: Lead; order: { id: string } }>(
          `/leads/${lead.id}/confirm`,
          { note: note ?? undefined },
        );
        toast({
          title: 'Lead tasdiqlandi',
          description: `Buyurtma yaratildi (#${response.order.id}).`,
        });
        await loadLeads();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Leadni tasdiqlashda xatolik.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setActionId(null);
      }
    },
    [loadLeads, toast],
  );

  const queueSummary = useMemo(() => {
    const newCount = leads.filter((lead) => lead.status === 'NEW').length;
    const assignedCount = leads.length - newCount;
    return { newCount, assignedCount };
  }, [leads]);

  return (
    <DashboardLayout role="operator">
      <div className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Lidlar navbati</h1>
            <p className="mt-1 text-sm text-slate-500">
              Trafik oqimlaridan kelgan yangi lidlarni qabul qiling va jarayonni boshqaring.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-sm text-slate-500 md:block">
              Yangi: <span className="font-semibold text-slate-900">{queueSummary.newCount}</span> ·
              Meniki: <span className="font-semibold text-slate-900">{queueSummary.assignedCount}</span>
            </div>
            <Button variant="outline" onClick={() => loadLeads()} disabled={loading}>
              Yangilash
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
            Ma’lumotlar yuklanmoqda...
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
            Hozircha lidlar mavjud emas. Trafik oqimlaridan yangi lidlar tushganda bu yerda paydo
            bo‘ladi.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Mijoz</th>
                  <th className="px-4 py-3 text-left">Telefon</th>
                  <th className="px-4 py-3 text-left">Mahsulot</th>
                  <th className="px-4 py-3 text-left">Oqim</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{lead.name ?? 'Anonim mijoz'}</div>
                      <div className="text-xs text-slate-500">
                        {new Intl.DateTimeFormat('uz-UZ', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(lead.createdAt))}
                      </div>
                      {lead.notes ? (
                        <p className="mt-1 text-xs text-amber-600">Izoh: {lead.notes}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-800">{lead.phone}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{lead.product?.title ?? '—'}</div>
                      <div className="text-xs text-slate-500">
                        Narx:{' '}
                        {lead.product?.price
                          ? new Intl.NumberFormat('uz-UZ', {
                              style: 'currency',
                              currency: 'UZS',
                              maximumFractionDigits: 0,
                            }).format(Number(lead.product.price))
                          : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.flow ? (
                        <div className="text-sm text-slate-700">
                          {lead.flow.title}
                          <div className="text-xs text-slate-400">/{lead.flow.slug}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Oqim topilmadi</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
                          statusStyles[lead.status],
                        )}
                      >
                        {statusLabels[lead.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {lead.status === 'NEW' ? (
                          <Button
                            size="sm"
                            onClick={() => handleAssign(lead)}
                            disabled={actionId === lead.id}
                          >
                            Qabul qilish
                          </Button>
                        ) : null}
                        {lead.status === 'ASSIGNED' || lead.status === 'CALLBACK' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCallback(lead)}
                              disabled={actionId === lead.id}
                            >
                              Qayta aloqa
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(lead)}
                              disabled={actionId === lead.id}
                            >
                              Bekor qilish
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleConfirm(lead)}
                              disabled={actionId === lead.id}
                            >
                              Tasdiqlash
                            </Button>
                          </>
                        ) : null}
                        {lead.status === 'CONFIRMED' ? (
                          <span className="text-xs text-emerald-600">Buyurtmaga yuborilgan</span>
                        ) : null}
                        {lead.status === 'CANCELLED' ? (
                          <span className="text-xs text-rose-500">Lead bekor qilingan</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OperatorLeadsPage;
