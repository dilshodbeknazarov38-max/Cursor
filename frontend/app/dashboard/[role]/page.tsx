import { notFound } from "next/navigation";

import { DashboardRoleClient, DashboardStats } from "@/components/dashboard/dashboard-role-client";
import {
  getDashboardConfig,
  SUPPORTED_DASHBOARD_ROLES,
} from "@/lib/dashboard-config";

type DashboardRolePageProps = {
  params: Promise<{ role: string }>;
};

async function getDashboardStats(role: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:3001/api";

  try {
    const res = await fetch(`${baseUrl}/stats/dashboard/${role}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Statistika topilmadi");
    }
    return (await res.json()) as DashboardStats;
  } catch {
    return {
      role,
      metrics: [
        { label: "Faol foydalanuvchilar", value: "1 284", change: "+8.6%" },
        { label: "Bugungi buyurtmalar", value: "342", change: "+4.2%" },
        { label: "Yangi lidlar", value: "892", change: "+6.4%" },
      ],
      charts: {
        leads: [
          { label: "Yan", value: 320 },
          { label: "Fev", value: 348 },
          { label: "Mar", value: 372 },
          { label: "Apr", value: 398 },
          { label: "May", value: 412 },
          { label: "Iyun", value: 436 },
        ],
        sales: [
          { label: "Yan", value: 220 },
          { label: "Fev", value: 238 },
          { label: "Mar", value: 252 },
          { label: "Apr", value: 268 },
          { label: "May", value: 284 },
          { label: "Iyun", value: 296 },
        ],
        active: [
          { label: "Du", value: 48 },
          { label: "Se", value: 52 },
          { label: "Chor", value: 55 },
          { label: "Pay", value: 53 },
          { label: "Ju", value: 58 },
          { label: "Sha", value: 63 },
          { label: "Yak", value: 40 },
        ],
      },
      summary: {
        users: 1284,
        leads: 3200,
        sales: 1980,
      },
      fromFallback: true,
    } satisfies DashboardStats;
  }
}

export default async function DashboardRolePage({
  params,
}: DashboardRolePageProps) {
  const { role } = await params;
  const config = getDashboardConfig(role);

  if (!config) {
    notFound();
  }

  const stats = await getDashboardStats(role);

  return <DashboardRoleClient config={config} stats={stats} />;
}

export function generateStaticParams() {
  return SUPPORTED_DASHBOARD_ROLES.map((role) => ({ role }));
}
