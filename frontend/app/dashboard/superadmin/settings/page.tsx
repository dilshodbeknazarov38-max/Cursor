'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { apiGet, apiPut } from '@/lib/apiClient';

type SystemSetting = {
  key: string;
  value: string;
  description: string;
  updatedAt: string;
};

const SuperAdminSettingsPage = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet<SystemSetting[]>('/admin/settings');
      setSettings(response);
      const defaults: Record<string, string> = {};
      response.forEach((setting) => {
        defaults[setting.key] = setting.value;
      });
      setEditedValues(defaults);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Sozlamalarni yuklashda xatolik.';
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
    void loadSettings();
  }, [loadSettings]);

  const handleChange = useCallback((key: string, value: string) => {
    setEditedValues((previous) => ({ ...previous, [key]: value }));
  }, []);

  const handleSave = useCallback(
    async (key: string) => {
      const value = editedValues[key];
      if (value === undefined) {
        return;
      }
      setSavingKey(key);
      try {
        const updated = await apiPut<SystemSetting, { value: string }>(
          `/admin/settings/${key}`,
          { value },
        );
        setSettings((previous) =>
          previous.map((setting) =>
            setting.key === key ? updated : setting,
          ),
        );
        toast({
          title: 'Sozlama saqlandi',
          description: `${key} muvaffaqiyatli yangilandi.`,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Sozlamani yangilashda xatolik.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setSavingKey(null);
      }
    },
    [editedValues, toast],
  );

  const handleReset = useCallback(
    async (key: string) => {
      setSavingKey(key);
      try {
        const updated = await apiPut<SystemSetting>(
          `/admin/settings/${key}/reset`,
        );
        setSettings((previous) =>
          previous.map((setting) =>
            setting.key === key ? updated : setting,
          ),
        );
        setEditedValues((previous) => ({
          ...previous,
          [key]: updated.value,
        }));
        toast({
          title: 'Defaultga qaytarildi',
          description: `${key} uchun standart qiymat tiklandi.`,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Defaultga qaytarishda xatolik.';
        toast({
          title: 'Xatolik',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setSavingKey(null);
      }
    },
    [toast],
  );

  const sortedSettings = useMemo(() => {
    return [...settings].sort((a, b) => a.key.localeCompare(b.key));
  }, [settings]);

  return (
    <DashboardLayout role="superadmin">
      <div className="space-y-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Tizim sozlamalari</h1>
            <p className="mt-1 text-sm text-slate-500">
              Payout limitlari, integratsiya kalitlari va texnik rejim sozlamalarini boshqaring.
            </p>
          </div>
          <Button variant="outline" onClick={() => loadSettings()} disabled={loading}>
            Yangilash
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Asosiy parametrlar</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                Sozlamalar yuklanmoqda...
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Kalit</th>
                    <th className="px-4 py-3 text-left">Tavsif</th>
                    <th className="px-4 py-3 text-left">Qiymat</th>
                    <th className="px-4 py-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedSettings.map((setting) => (
                    <tr key={setting.key} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {setting.key}
                        <p className="text-xs text-slate-500">
                          Yangilangan:{' '}
                          {new Intl.DateTimeFormat('uz-UZ', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          }).format(new Date(setting.updatedAt))}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {setting.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <Input
                          value={editedValues[setting.key] ?? ''}
                          onChange={(event) =>
                            handleChange(setting.key, event.target.value)
                          }
                          className="max-w-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReset(setting.key)}
                            disabled={savingKey === setting.key}
                          >
                            Default
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSave(setting.key)}
                            disabled={savingKey === setting.key}
                          >
                            Saqlash
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedSettings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        Sozlamalar topilmadi.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminSettingsPage;
