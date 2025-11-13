import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  BalancePageClient,
  BalanceResponse,
  BalanceTransaction,
  PayoutItem,
} from "@/components/dashboard/balance-client";
import {
  getDashboardConfig,
  SUPPORTED_DASHBOARD_ROLES,
} from "@/lib/dashboard-config";
import { API_BASE_URL } from "@/lib/api";
import { ACCESS_COOKIE } from "@/lib/session";

type BalanceDashboardPageProps = {
  params: Promise<{ role: string }>;
};

const EMPTY_BALANCE: BalanceResponse = {
  total: "0",
  accounts: [],
  recentTransactions: [],
};

export default async function BalanceDashboardPage({
  params,
}: BalanceDashboardPageProps) {
  const { role } = await params;
  const config = getDashboardConfig(role);

  if (!config) {
    notFound();
  }

  const token = cookies().get(ACCESS_COOKIE)?.value;

  let balance: BalanceResponse = { ...EMPTY_BALANCE };
  let transactions: BalanceTransaction[] = [];
  let payouts: PayoutItem[] = [];

  if (token) {
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

      if (balanceRes.ok) {
        balance = (await balanceRes.json()) as BalanceResponse;
      }

      if (transactionsRes.ok) {
        transactions = (await transactionsRes.json()) as BalanceTransaction[];
      } else {
        transactions = balance.recentTransactions ?? [];
      }

      if (payoutsRes.ok) {
        payouts = (await payoutsRes.json()) as PayoutItem[];
      }
    } catch (error) {
      console.error("Balance payout page error", error);
      balance = { ...EMPTY_BALANCE, fromFallback: true };
      transactions = [];
      payouts = [];
    }
  }

  return (
    <BalancePageClient
      role={config.slug}
      balance={balance}
      transactions={
        transactions.length > 0
          ? transactions
          : balance.recentTransactions ?? []
      }
      payouts={payouts}
    />
  );
}

export function generateStaticParams() {
  return SUPPORTED_DASHBOARD_ROLES.map((role) => ({ role }));
}
