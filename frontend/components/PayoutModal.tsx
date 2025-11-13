'use client';

import { useEffect, useMemo, useState } from 'react';

import { apiPost, ApiError } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

type PayoutModalProps = {
  open: boolean;
  onClose: () => void;
  mainBalance: number;
  onSuccess?: () => Promise<void> | void;
};

type PayoutFormState = {
  amount: string;
  cardNumber: string;
  cardHolder: string;
  comment: string;
};

type ValidationErrors = Partial<Record<keyof PayoutFormState, string>>;

const DEFAULT_FORM: PayoutFormState = {
  amount: '',
  cardNumber: '',
  cardHolder: '',
  comment: '',
};

const PayoutModal = ({ open, onClose, mainBalance, onSuccess }: PayoutModalProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState<PayoutFormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      setErrors({});
      setSubmitting(false);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const amountNumber = useMemo(() => {
    const value = Number(
      form.amount.replace(/\s+/g, '').replace(',', '.'),
    );
    return Number.isFinite(value) ? value : 0;
  }, [form.amount]);

  const validate = (): boolean => {
    const nextErrors: ValidationErrors = {};

    if (!form.amount || amountNumber <= 0) {
      nextErrors.amount = 'Summani kiriting (0 dan katta).';
    } else if (amountNumber > mainBalance) {
      nextErrors.amount = 'Summa asosiy balansdan oshib ketdi.';
    }

    if (!form.cardNumber.trim()) {
      nextErrors.cardNumber = 'Karta raqamini kiriting.';
    } else if (form.cardNumber.replace(/\s+/g, '').length < 8) {
      nextErrors.cardNumber = 'Karta raqami kamida 8 ta belgidan iborat bo‘lishi kerak.';
    }

    if (!form.cardHolder.trim()) {
      nextErrors.cardHolder = 'Karta egasi ism-familiyasini kiriting.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange =
    (key: keyof PayoutFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      await apiPost('/payouts', {
        amount: Number(amountNumber.toFixed(2)),
        cardNumber: form.cardNumber.trim(),
        cardHolder: form.cardHolder.trim(),
        comment: form.comment.trim() || undefined,
      });

      toast({
        title: 'So‘rov yuborildi',
        description: 'Payout so‘rovingiz kutilayotganlar ro‘yxatiga qo‘shildi.',
      });

      await onSuccess?.();
      onClose();
    } catch (error) {
      let message = 'To‘lov so‘rovini yuborishda xatolik yuz berdi.';
      if (error instanceof ApiError) {
        message = error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast({
        title: 'Xatolik',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  const remainingBalance = Math.max(mainBalance - amountNumber, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          aria-label="Modalni yopish"
        >
          ×
        </button>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <header>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Yechib olish
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              To‘lov so‘rovi
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Asosiy balansdan yechib olish so‘rovini yuboring.
            </p>
          </header>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Summa (UZS)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={handleChange('amount')}
                className={cn(
                  'mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100',
                  errors.amount &&
                    'border-red-300 focus:border-red-400 focus:ring-red-100',
                )}
                placeholder="50000"
              />
              <p className="mt-1 text-xs text-slate-500">
                Balansingiz: {formatCurrency(mainBalance, 'UZS')} | Yechilgandan so‘ng:{' '}
                {formatCurrency(remainingBalance, 'UZS')}
              </p>
              {errors.amount ? (
                <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Karta raqami
              </label>
              <input
                type="text"
                value={form.cardNumber}
                onChange={handleChange('cardNumber')}
                className={cn(
                  'mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100',
                  errors.cardNumber &&
                    'border-red-300 focus:border-red-400 focus:ring-red-100',
                )}
                placeholder="8600 xxxx xxxx xxxx"
              />
              {errors.cardNumber ? (
                <p className="mt-1 text-xs text-red-600">{errors.cardNumber}</p>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Karta egasi (F.I.Sh)
              </label>
              <input
                type="text"
                value={form.cardHolder}
                onChange={handleChange('cardHolder')}
                className={cn(
                  'mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100',
                  errors.cardHolder &&
                    'border-red-300 focus:border-red-400 focus:ring-red-100',
                )}
                placeholder="Aliyev Ali"
              />
              {errors.cardHolder ? (
                <p className="mt-1 text-xs text-red-600">{errors.cardHolder}</p>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Izoh (ixtiyoriy)
              </label>
              <textarea
                value={form.comment}
                onChange={handleChange('comment')}
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                placeholder="Qo‘shimcha ma’lumot kiriting..."
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              disabled={submitting}
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting}
            >
              {submitting ? 'Yuborilmoqda...' : 'So‘rov yuborish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export type { PayoutModalProps };
export default PayoutModal;
