'use client';

import { useEffect } from 'react';

type PayoutModalProps = {
  open: boolean;
  onClose: () => void;
  amount: number;
  cardNumber: string;
  comment?: string;
  currency?: string;
};

const maskCardNumber = (value: string) => {
  const sanitized = value.replace(/\s+/g, '');
  if (sanitized.length <= 4) {
    return sanitized;
  }
  const visible = sanitized.slice(-4);
  return `**** **** **** ${visible}`;
};

const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

const PayoutModal = ({ open, onClose, amount, cardNumber, comment, currency = 'UZS' }: PayoutModalProps) => {
  useEffect(() => {
    if (!open) {
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

    if (!open) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            aria-label="Modalni yopish"
          >
            ×
          </button>

          <div className="space-y-6">
            <header>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Payout</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">To‘lov tafsilotlari</h2>
            </header>

            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-slate-500">Summa</dt>
                <dd className="text-lg font-semibold text-slate-900">{formatAmount(amount, currency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-slate-500">Karta</dt>
                <dd className="text-sm font-medium text-slate-900">{maskCardNumber(cardNumber)}</dd>
              </div>
              {comment ? (
                <div>
                  <dt className="text-sm text-slate-500">Izoh</dt>
                  <dd className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{comment}</dd>
                </div>
              ) : null}
            </dl>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      </div>
    );
};

export type { PayoutModalProps };
export default PayoutModal;
