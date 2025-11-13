"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { API_BASE_URL } from "@/lib/api";
import { getClientAccessToken } from "@/lib/session";

export type AdminPayout = {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  cardNumber?: string | null;
  cardHolder?: string | null;
  comment?: string | null;
  userId?: string | null;
};

export type FraudCheck = {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  transaction?: {
    id: string;
    type: string;
    amount: string;
    accountType?: string | null;
    createdAt: string;
  } | null;
};

type AdminPayoutsClientProps = {
  payouts: AdminPayout[];
  fraudChecks: FraudCheck[];
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-700 border border-rose-200",
  PAID: "bg-sky-100 text-sky-700 border border-sky-200",
  CANCELLED: "bg-neutral-200 text-neutral-600 border border-neutral-300",
};

const FRAUD_STATUS_LABELS: Record<string, string> = {
  OPEN: "Yangi",
  REVIEWING: "Ko‘rib chiqilmoqda",
  RESOLVED: "Yopildi",
  REVOKED: "Bekor qilindi",
};

export function AdminPayoutsClient({
  payouts: initialPayouts,
  fraudChecks: initialFraudChecks,
}: AdminPayoutsClientProps) {
  const { toast } = useToast();

  const [payouts, setPayouts] = useState<AdminPayout[]>(initialPayouts);
  const [fraudChecks, setFraudChecks] =
    useState<FraudCheck[]>(initialFraudChecks);
  const [processing, setProcessing] = useState<string | null>(null);
  const [updatingFraud, setUpdatingFraud] = useState<string | null>(null);

  const pendingPayouts = payouts.filter(
    (payout) => payout.status === "PENDING",
  );

  async function refreshData() {
    const token = getClientAccessToken();
    if (!token) {
      toast({
        title: "Sessiya topilmadi",
        description: "Ma’lumotlarni yangilash uchun qayta tizimga kiring.",
        variant: "destructive",
      });
      return;
    }

    try {
      const [payoutsRes, fraudRes] = await Promise.all([
        fetch(`${API_BASE_URL}/payouts`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch(`${API_BASE_URL}/balances/admin/fraud`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
      ]);

      if (payoutsRes.ok) {
        setPayouts((await payoutsRes.json()) as AdminPayout[]);
      }
      if (fraudRes.ok) {
        setFraudChecks((await fraudRes.json()) as FraudCheck[]);
      }
    } catch (error) {
      console.error("Admin payouts refresh", error);
      toast({
        title: "Xatolik",
        description: "Ma’lumotlar yangilanmadi.",
        variant: "destructive",
      });
    }
  }

  async function updatePayoutStatus(id: string, status: string) {
    const token = getClientAccessToken();
    if (!token) {
      toast({
        title: "Sessiya topilmadi",
        description: "Amalni bajarish uchun qayta tizimga kiring.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(id);
    try {
      const response = await fetch(`${API_BASE_URL}/payouts/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          typeof errorBody?.message === "string"
            ? errorBody.message
            : "Status yangilanmadi.",
        );
      }

      await refreshData();
      toast({
        title: "Status yangilandi",
        description: `Payout so‘rovi "${status}" holatiga o‘tkazildi.`,
      });
    } catch (error) {
      console.error("Update payout status", error);
      toast({
        title: "Xatolik",
        description:
          error instanceof Error
            ? error.message
            : "Payout statusini yangilashda muammo yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  }

  async function updateFraudStatus(
    id: string,
    status: string,
    note?: string,
  ) {
    const token = getClientAccessToken();
    if (!token) {
      toast({
        title: "Sessiya topilmadi",
        description: "Amalni bajarish uchun qayta tizimga kiring.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingFraud(id);
    try {
      const response = await fetch(`${API_BASE_URL}/balances/admin/fraud/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          resolutionNote: note,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          typeof errorBody?.message === "string"
            ? errorBody.message
            : "Fraud statusi yangilanmadi.",
        );
      }

      await refreshData();
      toast({
        title: "Fraud holati yangilandi",
        description: `Tekshiruv "${status}" holatiga o‘tkazildi.`,
      });
    } catch (error) {
      console.error("Fraud update error", error);
      toast({
        title: "Xatolik",
        description:
          error instanceof Error
            ? error.message
            : "Fraud tekshiruvi yangilanmadi.",
        variant: "destructive",
      });
    } finally {
      setUpdatingFraud(null);
    }
  }

  const hasFraud = fraudChecks.length > 0;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-neutral-900">
              Kutilayotgan payout so‘rovlari
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Karta
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Summa
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Amallar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {pendingPayouts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-neutral-500"
                      >
                        Kutilayotgan payout so‘rovlari mavjud emas.
                      </td>
                    </tr>
                  ) : (
                    pendingPayouts.map((payout) => (
                      <tr key={payout.id}>
                        <td className="px-4 py-3 text-neutral-600">
                          {formatDate(payout.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {maskCardNumber(payout.cardNumber)}
                          <span className="block text-xs text-neutral-500">
                            {payout.cardHolder ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-neutral-900">
                          {formatCurrency(parseFloat(payout.amount ?? "0"))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              disabled={processing === payout.id}
                              onClick={() =>
                                void updatePayoutStatus(payout.id, "APPROVED")
                              }
                            >
                              Tasdiqlash
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={processing === payout.id}
                              onClick={() =>
                                void updatePayoutStatus(payout.id, "REJECTED")
                              }
                            >
                              Rad etish
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-neutral-900">
              Fraud tekshiruvlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {!hasFraud ? (
              <p className="text-sm text-neutral-600">
                Fraud tekshiruvlari ro‘yxati bo‘sh.
              </p>
            ) : (
              fraudChecks.map((check) => (
                <div
                  key={check.id}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {check.reason}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        STATUS_STYLES[check.status] ??
                        "bg-neutral-200 text-neutral-700 border border-neutral-300"
                      }`}
                    >
                      {FRAUD_STATUS_LABELS[check.status] ?? check.status}
                    </span>
                  </div>
                  {check.transaction ? (
                    <p className="mt-2 text-xs text-neutral-600">
                      Tranzaksiya: {check.transaction.type} •{" "}
                      {formatCurrency(
                        parseFloat(check.transaction.amount ?? "0"),
                      )}{" "}
                      • {formatDate(check.transaction.createdAt)}
                    </p>
                  ) : null}
                  {check.resolutionNote ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      Izoh: {check.resolutionNote}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {check.status !== "REVIEWING" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingFraud === check.id}
                        onClick={() =>
                          void updateFraudStatus(check.id, "REVIEWING")
                        }
                      >
                        Ko‘rib chiqish
                      </Button>
                    ) : null}
                    {check.status !== "RESOLVED" ? (
                      <Button
                        size="sm"
                        disabled={updatingFraud === check.id}
                        onClick={() => {
                          const note = window.prompt(
                            "Yakuniy izoh (ixtiyoriy)",
                          );
                          void updateFraudStatus(
                            check.id,
                            "RESOLVED",
                            note ?? undefined,
                          );
                        }}
                      >
                        Yopish
                      </Button>
                    ) : null}
                    {check.status !== "REVOKED" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={updatingFraud === check.id}
                        onClick={() => {
                          const note = window.prompt(
                            "Bekor qilish sababi (ixtiyoriy)",
                          );
                          void updateFraudStatus(
                            check.id,
                            "REVOKED",
                            note ?? undefined,
                          );
                        }}
                      >
                        Bekor qilish
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-neutral-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-neutral-900">
                  Barcha payout so‘rovlari
                </CardTitle>
                <p className="text-xs text-neutral-500">
                  Yangi statuslar bilan ro‘yxatni yangilash uchun yangilash
                  tugmasidan foydalaning.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void refreshData()}>
                Yangilash
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[28rem] overflow-y-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Sana</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Summa
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Karta
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Izoh
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {payouts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-neutral-500"
                      >
                        Payout so‘rovlari mavjud emas.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => {
                      const badge =
                        STATUS_STYLES[payout.status] ??
                        "bg-neutral-200 text-neutral-700 border border-neutral-300";
                      return (
                        <tr key={payout.id}>
                          <td className="px-4 py-3 text-neutral-600">
                            {formatDate(payout.createdAt)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-neutral-900">
                            {formatCurrency(parseFloat(payout.amount ?? "0"))}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge}`}
                            >
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-700">
                            {maskCardNumber(payout.cardNumber)}
                            <span className="block text-xs text-neutral-500">
                              {payout.cardHolder ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {payout.comment ?? "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "0 so‘m";
  }
  return value.toLocaleString("uz-UZ", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
  });
}

function formatDate(value: string) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("uz-UZ");
}

function maskCardNumber(cardNumber?: string | null) {
  if (!cardNumber || cardNumber.length < 6) {
    return cardNumber ?? "—";
  }
  return cardNumber.replace(/.(?=.{4})/g, "•");
}
