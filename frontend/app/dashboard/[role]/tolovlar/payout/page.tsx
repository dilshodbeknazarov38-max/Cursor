import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  AdminPayoutsClient,
  type AdminPayout,
  type FraudCheck,
} from "@/components/dashboard/admin-payouts-client";
import {
  getDashboardConfig,
  SUPPORTED_DASHBOARD_ROLES,
} from "@/lib/dashboard-config";
import { API_BASE_URL } from "@/lib/api";
import { ACCESS_COOKIE } from "@/lib/session";

type AdminPayoutsPageProps = {
  params: Promise<{ role: string }>;
};

export default async function AdminPayoutsPage({
  params,
}: AdminPayoutsPageProps) {
  const { role } = await params;
  const config = getDashboardConfig(role);

  if (!config || config.slug !== "admin") {
    notFound();
  }

  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) {
    notFound();
  }

  let payouts: AdminPayout[] = [];
  let fraudChecks: FraudCheck[] = [];

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
      payouts = (await payoutsRes.json()) as AdminPayout[];
    }
    if (fraudRes.ok) {
      fraudChecks = (await fraudRes.json()) as FraudCheck[];
    }
  } catch (error) {
    console.error("Admin payouts page error", error);
  }

  return <AdminPayoutsClient payouts={payouts} fraudChecks={fraudChecks} />;
}

export function generateStaticParams() {
  return SUPPORTED_DASHBOARD_ROLES.map((role) => ({ role }));
}
