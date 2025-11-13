"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { API_BASE_URL } from "@/lib/api";
import { getClientAccessToken } from "@/lib/session";

type BalanceAccount = {
  id: string;
  type: string;
  amount: string;
  currency: string;
  updatedAt: string;
};

export type BalanceTransaction = {
  id: string;
  accountType?: string | null;
  type: string;
  amount: string;
  balanceBefore?: string;
  balanceAfter?: string;
  isCredit: boolean;
  createdAt: string;
  note?: string | null;
};

export type PayoutItem = {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  cardNumber?: string | null;
  cardHolder?: string | null;
  comment?: string | null;
};

export type BalanceResponse = {
  total: string;
  accounts: BalanceAccount[];
  recentTransactions: BalanceTransaction[];
  fromFallback?: boolean;
};

type BalancePageClientProps = {
  role: string;
  balance: BalanceResponse;
  transactions: BalanceTransaction[];
  payouts: PayoutItem[];
};

const payoutSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Summani raqamda kiriting." })
    .positive({ message: "Summani musbat kiriting." }),
  cardNumber: z
    .string()
    .regex(/^(8600|9860)\d{12}$/, {
      message: "Uzcard yoki Humo karta raqamini to‘liq kiriting.",
    }),
  cardHolder: z
    .string()
    .min(3, { message: "Karta egasi ismini kiriting." })
    .max(60, { message: "Ism 60 belgidan oshmasligi kerak." }),
  comment: z
    .string()
    .max(300, { message: "Izoh 300 belgidan oshmasligi kerak." })
    .optional()
    .or(z.literal("")),
});

type PayoutFormValues = z.infer<typeof payoutSchema>;

const ACCOUNT_LABELS: Record<string, string> = {
  TARGETOLOG_HOLD: "Targetolog — Hold balans",
  TARGETOLOG_MAIN: "Targetolog — Asosiy balans",
  OPERATOR_HOLD: "Operator — Hold balans",
  OPERATOR_MAIN: "Operator — Asosiy balans",
  SELLER_MAIN: "Sotuvchi — Asosiy balans",
  AFFILIATE_MAIN: "Affiliate — Asosiy balans",
  BLOGGER_MAIN: "Blogger — Asosiy balans",
  MANAGER_MAIN: "Menejer — Asosiy balans",
  GENERIC_MAIN: "Asosiy balans",
};

const TRANSACTION_LABELS: Record<string, string> = {
  LEAD_ACCEPTED: "Lead qabul qilindi",
  LEAD_SOLD: "Lead sotildi",
  LEAD_CANCELLED: "Lead bekor qilindi",
  PAYOUT_REQUEST: "Payout so‘rovi",
  PAYOUT_APPROVED: "Payout tasdiqlandi",
  PAYOUT_REJECTED: "Payout rad etildi",
  ADMIN_ADJUSTMENT: "Admin tuzatishi",
  FRAUD_REVERSAL: "Fraud qaytarildi",
};

const STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Tasdiqlanishda",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  APPROVED: {
    label: "Tasdiqlandi",
    className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  REJECTED: {
    label: "Rad etildi",
    className: "bg-rose-100 text-rose-700 border border-rose-200",
  },
  PAID: {
    label: "To‘landi",
    className: "bg-sky-100 text-sky-700 border border-sky-200",
  },
  CANCELLED: {
    label: "Bekor qilindi",
    className: "bg-neutral-200 text-neutral-600 border border-neutral-300",
  },
};

const ROLE_MAIN_MAP: Record<string, string> = {
  TARGETOLOG: "TARGETOLOG_MAIN",
  OPERATOR: "OPERATOR_MAIN",
  SOTUVCHI: "SELLER_MAIN",
  SELLER_ADMIN: "SELLER_MAIN",
  TARGET_ADMIN: "GENERIC_MAIN",
  OPER_ADMIN: "GENERIC_MAIN",
  SKLAD_ADMIN: "GENERIC_MAIN",
  ADMIN: "GENERIC_MAIN",
  SUPER_ADMIN: "GENERIC_MAIN",
};

export function BalancePageClient({
  role,
  balance: initialBalance,
  transactions: initialTransactions,
  payouts: initialPayouts,
}: BalancePageClientProps) {
  const { toast } = useToast();

  const normalizedRole = role?.toUpperCase() ?? "";
  const mainAccountType =
    ROLE_MAIN_MAP[normalizedRole] ?? "GENERIC_MAIN";

  const [balance, setBalance] = useState(initialBalance);
  const [transactions, setTransactions] =
    useState<BalanceTransaction[]>(initialTransactions);
  const [payouts, setPayouts] = useState<PayoutItem[]>(initialPayouts);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const accounts = balance.accounts ?? [];
  const mainAccount = accounts.find(
    (account) => account.type === mainAccountType,
  );
  const holdAccounts = accounts.filter(
    (account) => account.type !== mainAccountType,
  );

  const maxAmount = useMemo(() => {
    if (!mainAccount) {
      return 0;
    }
    const parsed = parseFloat(mainAccount.amount ?? "0");
    return Number.isFinite(parsed) ? parsed : 0;
  }, [mainAccount]);

  const form = useForm<PayoutFormValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      amount: 0,
      cardNumber: "",
      cardHolder: "",
      comment: "",
    },
  });

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

    setRefreshing(true);
    try {
      const [balanceRes, transactionsRes, payoutsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/balances/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch(`${API_BASE_URL}/balances/me/transactions?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        fetch(`${API_BASE_URL}/payouts`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
      ]);

      if (!balanceRes.ok || !transactionsRes.ok || !payoutsRes.ok) {
        throw new Error("Ma’lumotlar yangilanmadi");
      }

      const nextBalance = (await balanceRes.json()) as BalanceResponse;
      const nextTransactions =
        (await transactionsRes.json()) as BalanceTransaction[];
      const nextPayouts = (await payoutsRes.json()) as PayoutItem[];

      setBalance({ ...nextBalance, fromFallback: false });
      setTransactions(nextTransactions);
      setPayouts(nextPayouts);
      toast({
        title: "Ma’lumotlar yangilandi",
        description: "Balans va tarix yangilandi.",
      });
    } catch (error) {
      console.error("Balance refresh error", error);
      toast({
        title: "Xatolik",
        description: "Ma’lumotlarni yangilashda muammo yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function onSubmit(values: PayoutFormValues) {
    const token = getClientAccessToken();
    if (!token) {
      toast({
        title: "Sessiya topilmadi",
        description: "Payout so‘rovi yuborish uchun qayta tizimga kiring.",
        variant: "destructive",
      });
      return;
    }
    if (values.amount > maxAmount) {
      form.setError("amount", {
        type: "manual",
        message: `Maksimal ruxsat etilgan summa ${formatCurrency(maxAmount)}.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: values.amount,
          cardNumber: values.cardNumber,
          cardHolder: values.cardHolder,
          comment: values.comment,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          typeof errorBody?.message === "string"
            ? errorBody.message
            : "Payout so‘rovi yuborilmadi.";
        throw new Error(message);
      }

      form.reset({
        amount: 0,
        cardNumber: "",
        cardHolder: "",
        comment: "",
      });

      await refreshData();
      toast({
        title: "So‘rov yuborildi",
        description:
          "Payout so‘rovi muvaffaqiyatli yuborildi. Admin tasdiqlashini kuting.",
      });
    } catch (error) {
      console.error("Payout request error", error);
      toast({
        title: "Xatolik",
        description:
          error instanceof Error
            ? error.message
            : "Payout so‘rovini yuborishda muammo yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const canRequestPayout = maxAmount > 0.5;

  return (
    <div className="space-y-8">
      {balance.fromFallback ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-5">
            <p className="text-sm text-amber-800">
              API bilan bog‘lanib bo‘lmadi. Balans ma’lumotlari yangilanmadi.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-neutral-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-neutral-900">
              Umumiy balans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <p className="text-3xl font-bold text-neutral-900">
              {formatCurrency(parseFloat(balance.total ?? "0"))}
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Hold va asosiy balanslar yig‘indisi.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={refreshing}
              onClick={() => void refreshData()}
            >
              {refreshing ? "Yangilanmoqda..." : "Balansni yangilash"}
            </Button>
          </CardContent>
        </Card>

        {accounts.map((account) => (
          <Card key={account.id} className="border-neutral-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-neutral-800">
                {ACCOUNT_LABELS[account.type] ?? account.type}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(parseFloat(account.amount ?? "0"))}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Oxirgi yangilanish:{" "}
                {formatDate(account.updatedAt)}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-neutral-900">
              Payout so‘rovi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>So‘rov summasi</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          disabled={!canRequestPayout || submitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Karta raqami</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="8600123412341234"
                          inputMode="numeric"
                          maxLength={16}
                          disabled={submitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardHolder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Karta egasi (lotincha)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ISMI FAMILYASI"
                          disabled={submitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Izoh (ixtiyoriy)</FormLabel>
                      <FormControl>
                        <textarea
                          className="min-h-[90px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Qo‘shimcha izoh"
                          disabled={submitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <CardFooter className="flex items-center justify-between px-0">
                  <p className="text-xs text-neutral-500">
                    Asosiy balans:{" "}
                    <span className="font-semibold text-neutral-900">
                      {formatCurrency(maxAmount)}
                    </span>
                  </p>
                  <Button
                    type="submit"
                    disabled={submitting || !canRequestPayout}
                  >
                    {submitting ? "Yuborilmoqda..." : "So‘rov yuborish"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
            {!canRequestPayout ? (
              <p className="mt-4 text-sm text-neutral-500">
                Payout so‘rovi yuborish uchun asosiy balansingizda mablag‘
                bo‘lishi kerak.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-neutral-900">
              Hold balanslar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {holdAccounts.length === 0 ? (
              <p className="text-sm text-neutral-600">
                Hold balans mavjud emas.
              </p>
            ) : (
              holdAccounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-neutral-900">
                    {ACCOUNT_LABELS[account.type] ?? account.type}
                  </p>
                  <p className="mt-1 text-lg font-bold text-neutral-800">
                    {formatCurrency(parseFloat(account.amount ?? "0"))}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Yangilangan vaqt: {formatDate(account.updatedAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-neutral-900">
              So‘nggi balans tranzaksiyalari
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Sana
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Balans
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Amal
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Summa
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-sm text-neutral-500"
                      >
                        Tranzaksiyalar mavjud emas.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="bg-white">
                        <td className="px-4 py-3 text-neutral-600">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-neutral-800">
                          {ACCOUNT_LABELS[tx.accountType ?? ""] ??
                            tx.accountType ??
                            "—"}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {TRANSACTION_LABELS[tx.type] ?? tx.type}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            tx.isCredit
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {tx.isCredit ? "+" : "-"}
                          {formatCurrency(parseFloat(tx.amount ?? "0"))}
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
              Payout so‘rovlar tarixi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Sana
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Karta
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Summa
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {payouts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-sm text-neutral-500"
                      >
                        Payout so‘rovlari hali yuborilmagan.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => {
                      const status = STATUS_STYLES[payout.status] ?? {
                        label: payout.status,
                        className:
                          "bg-neutral-200 text-neutral-700 border border-neutral-300",
                      };
                      return (
                        <tr key={payout.id} className="bg-white">
                          <td className="px-4 py-3 text-neutral-600">
                            {formatDate(payout.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-neutral-700">
                            {maskCardNumber(payout.cardNumber) ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-neutral-800">
                            {formatCurrency(
                              parseFloat(payout.amount ?? "0"),
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                            >
                              {status.label}
                            </span>
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

function formatDate(value: string | Date | undefined | null) {
  if (!value) {
    return "—";
  }
  const date = value instanceof Date ? value : new Date(value);
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
