import { notFound } from "next/navigation";

import { cookies } from "next/headers";

import { DashboardRoleClient, DashboardStats } from "@/components/dashboard/dashboard-role-client";
import {
  getDashboardConfig,
  SUPPORTED_DASHBOARD_ROLES,
} from "@/lib/dashboard-config";
import { API_BASE_URL } from "@/lib/api";
import { ACCESS_COOKIE } from "@/lib/session";

type DashboardRolePageProps = {
  params: Promise<{ role: string }>;
};

async function fetchDashboardStats(role: string) {
  const baseUrl = API_BASE_URL;
  const token = cookies().get(ACCESS_COOKIE)?.value;

  if (!token) {
    return fallbackStats(role);
  }

  try {
    const res = await fetch(`${baseUrl}/stats/dashboard/${role}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Statistika topilmadi");
    }

    const data = (await res.json()) as DashboardStats;
    return { ...data, fromFallback: false };
  } catch (error) {
    console.error("Dashboard stats error", error);
    return fallbackStats(role);
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

  const stats = await fetchDashboardStats(role);

  return <DashboardRoleClient config={config} stats={stats} />;
}

export function generateStaticParams() {
  return SUPPORTED_DASHBOARD_ROLES.map((role) => ({ role }));
}

function fallbackStats(role: string): DashboardStats {
  return {
    role,
    overview: {
      totalUsers: 0,
      totalLeads: 0,
      deliveredOrders: 0,
    },
    summaryCards: [
      { label: "Bugungi leadlar", value: "0 ta" },
      { label: "Bugungi buyurtmalar", value: "0 ta" },
      { label: "Tasdiqlangan buyurtmalar", value: "0 ta" },
      { label: "Umumiy daromad", value: "0 so‘m" },
    ],
    charts: {
      leads: [
        { label: "Yan", value: 0 },
        { label: "Fev", value: 0 },
        { label: "Mar", value: 0 },
        { label: "Apr", value: 0 },
        { label: "May", value: 0 },
        { label: "Iyun", value: 0 },
      ],
      sales: [
        { label: "Yan", value: 0 },
        { label: "Fev", value: 0 },
        { label: "Mar", value: 0 },
        { label: "Apr", value: 0 },
        { label: "May", value: 0 },
        { label: "Iyun", value: 0 },
      ],
      activity: [
        { label: "Yak", value: 0 },
        { label: "Du", value: 0 },
        { label: "Se", value: 0 },
        { label: "Chor", value: 0 },
        { label: "Pay", value: 0 },
        { label: "Ju", value: 0 },
        { label: "Sha", value: 0 },
      ],
    },
    ordersByStatus: [
      { key: "new", label: "Yangi", status: "NEW", count: 0, color: "info" },
      {
        key: "assigned",
        label: "Operator belgilandi",
        status: "ASSIGNED",
        count: 0,
        color: "info",
      },
      {
        key: "in_delivery",
        label: "Yetkazilmoqda",
        status: "IN_DELIVERY",
        count: 0,
        color: "info",
      },
      {
        key: "delivered",
        label: "Yetkazilgan",
        status: "DELIVERED",
        count: 0,
        color: "success",
      },
      {
        key: "returned",
        label: "Qaytarilgan",
        status: "RETURNED",
        count: 0,
        color: "danger",
      },
      {
        key: "recontact",
        label: "Qayta aloqa",
        status: "RECONTACT",
        count: 0,
        color: "warning",
      },
      {
        key: "archived",
        label: "Arxiv",
        status: "ARCHIVED",
        count: 0,
        color: "muted",
      },
    ],
    topPerformers: {},
    recentActivity: [],
    quickActions: [],
    notifications: [],
    fromFallback: true,
  };
}
