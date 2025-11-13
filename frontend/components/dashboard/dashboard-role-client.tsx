"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { TrendChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import type { DashboardRoleConfig } from "@/lib/dashboard-config";
import { API_BASE_URL } from "@/lib/api";
import {
  clearSession,
  getClientAccessToken,
} from "@/lib/session";

type TrendPoint = {
  label: string;
  value: number;
};

type OrdersByStatusItem = {
  key: string;
  label: string;
  status: string;
  count: number;
  color: "success" | "info" | "warning" | "danger" | "muted";
};

type TopPerformer = {
  id: string;
  name: string;
  orders: number;
  revenue?: number;
  leads?: number;
};

type RecentActivityItem = {
  id: string;
  message: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    role: string | null;
  } | null;
};

type NotificationItem = {
  id: string;
  message: string;
  type: string;
  seen: boolean;
  createdAt: string;
  metadata?: unknown;
};

export type DashboardStats = {
  role: string;
  overview: {
    totalUsers: number;
    totalLeads: number;
    deliveredOrders: number;
    roleCounts?: {
      targetologs: number;
      sellers: number;
      operators: number;
    };
  };
  summaryCards: {
    label: string;
    value: string;
    helper?: string;
  }[];
  charts: {
    leads: TrendPoint[];
    sales: TrendPoint[];
    activity: TrendPoint[];
  };
  ordersByStatus: OrdersByStatusItem[];
  topPerformers: {
    targetologists?: TopPerformer[];
    sellers?: TopPerformer[];
    operators?: TopPerformer[];
  };
  recentActivity: RecentActivityItem[];
  quickActions: {
    label: string;
    href: string;
  }[];
  notifications: NotificationItem[];
  fromFallback?: boolean;
};

type DashboardRoleClientProps = {
  config: DashboardRoleConfig;
  stats: DashboardStats;
};

const STATUS_COLOR_MAP: Record<
  OrdersByStatusItem["color"],
  string
> = {
  success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  info: "bg-sky-100 text-sky-700 border-sky-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  danger: "bg-rose-100 text-rose-700 border-rose-200",
  muted: "bg-neutral-200 text-neutral-700 border-neutral-300",
};

const formatNumber = (value: number) =>
  value.toLocaleString("uz-UZ");

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("uz-UZ");

export function DashboardRoleClient({
  config,
  stats,
}: DashboardRoleClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStats, setCurrentStats] = useState(stats);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setCurrentStats(stats);
  }, [stats]);

  useEffect(() => {
    if (stats.fromFallback) {
      toast({
        title: "Namunaviy ma’lumotlar",
        description:
          "API vaqtincha mavjud emas. Dashboardda sinov ko‘rsatkichlari aks etmoqda.",
        variant: "destructive",
      });
    }
  }, [stats.fromFallback, toast]);

  const handleRefresh = async () => {
    const token = getClientAccessToken();
    if (!token) {
      toast({
        title: "Sessiya topilmadi",
        description: "Iltimos, qayta kirish qiling.",
        variant: "destructive",
      });
      return;
    }

    setRefreshing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/stats/dashboard/${config.slug}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Statistika yangilanmadi");
      }

      const nextStats = (await response.json()) as DashboardStats;
      setCurrentStats({ ...nextStats, fromFallback: false });
      toast({
        title: "Ma’lumotlar yangilandi",
        description: "So‘nggi statistikalar yuklandi.",
      });
    } catch (error) {
      console.error("Dashboard refresh error", error);
      toast({
        title: "Xatolik",
        description:
          "Dashboard ma’lumotlarini yangilashda muammo yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    const token = getClientAccessToken();
    if (!token) {
      clearSession();
      router.push("/kirish");
      return;
    }

    setLoggingOut(true);
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: undefined }),
      });
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      clearSession();
      setLoggingOut(false);
      router.push("/kirish");
      toast({
        title: "Sessiya yakunlandi",
        description: "Siz tizimdan chiqdingiz.",
      });
    }
  };

  const summaryCards = useMemo(
    () => currentStats.summaryCards ?? [],
    [currentStats.summaryCards],
  );

  const topTargetologists = currentStats.topPerformers.targetologists ?? [];
  const topSellers = currentStats.topPerformers.sellers ?? [];
  const topOperators = currentStats.topPerformers.operators ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            {config.title}
          </h1>
          <p className="text-sm text-neutral-600">{config.description}</p>
          {currentStats.overview.roleCounts ? (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 font-medium">
                Targetologlar:{" "}
                {formatNumber(currentStats.overview.roleCounts.targetologs)}
              </span>
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 font-medium">
                Sotuvchilar:{" "}
                {formatNumber(currentStats.overview.roleCounts.sellers)}
              </span>
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 font-medium">
                Operatorlar:{" "}
                {formatNumber(currentStats.overview.roleCounts.operators)}
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {currentStats.quickActions.map((action) => (
            <Button
              key={action.href}
              variant="outline"
              size="sm"
              asChild
              className="text-xs font-medium"
            >
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="text-xs font-medium"
          >
            {refreshing ? "Yangilanmoqda..." : "Yangilash"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="text-xs font-medium"
          >
            {loggingOut ? "Chiqilmoqda..." : "Chiqish"}
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={`${config.slug}-${card.label}`} className="shadow-sm">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {card.label}
              </p>
              <p className="text-2xl font-semibold text-neutral-900">
                {card.value}
              </p>
              {card.helper ? (
                <p className="text-xs text-neutral-500">{card.helper}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <TrendChart
          title="Leadlar trendlari"
          description="Oylik leadlar soni"
          data={currentStats.charts.leads}
          gradientId="lead-trend"
        />
        <TrendChart
          title="Sotuv trendlari"
          description="Oylik sotuvlar soni"
          data={currentStats.charts.sales}
          gradientId="sales-trend"
        />
        <TrendChart
          title="Faollik grafigi"
          description="Oxirgi 7 kunlik faollik"
          data={currentStats.charts.activity}
          gradientId="activity-trend"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border-neutral-200 bg-neutral-50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-neutral-700">
              Umumiy foydalanuvchilar
            </h3>
            <p className="mt-3 text-3xl font-bold text-neutral-900">
              {formatNumber(currentStats.overview.totalUsers)}
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Tizimga kirish huquqiga ega barcha foydalanuvchilar.
            </p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 bg-neutral-50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-neutral-700">
              Umumiy leadlar
            </h3>
            <p className="mt-3 text-3xl font-bold text-neutral-900">
              {formatNumber(currentStats.overview.totalLeads)}
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Targetologlar tomonidan yetkazilgan leadlar soni.
            </p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 bg-neutral-50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-neutral-700">
              Yakunlangan buyurtmalar
            </h3>
            <p className="mt-3 text-3xl font-bold text-neutral-900">
              {formatNumber(currentStats.overview.deliveredOrders)}
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Yetkazib berish yakunlangan buyurtmalar soni.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-neutral-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-neutral-900">
              Buyurtmalar statuslari
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {currentStats.ordersByStatus.map((status) => (
              <div
                key={status.key}
                className={`rounded-lg border px-4 py-3 text-sm font-semibold ${STATUS_COLOR_MAP[status.color]}`}
              >
                <p className="text-xs uppercase tracking-wide">
                  {status.label}
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatNumber(status.count)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {(topTargetologists.length > 0 ||
        topSellers.length > 0 ||
        topOperators.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-3">
          {topTargetologists.length > 0 ? (
            <Card className="border-neutral-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-neutral-900">
                  Top targetologlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topTargetologists.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-neutral-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-neutral-600">
                      Leadlar: {item.leads ?? 0} • Buyurtmalar: {item.orders} •
                      Daromad: {formatNumber(Math.round(item.revenue ?? 0))} so‘m
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {topSellers.length > 0 ? (
            <Card className="border-neutral-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-neutral-900">
                  Top sotuvchilar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topSellers.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-neutral-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-neutral-600">
                      Buyurtmalar: {item.orders} • Daromad:{" "}
                      {formatNumber(Math.round(item.revenue ?? 0))} so‘m
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {topOperators.length > 0 ? (
            <Card className="border-neutral-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-neutral-900">
                  Top operatorlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topOperators.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-neutral-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-neutral-600">
                      Qabul qilingan buyurtmalar: {item.orders}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </section>
      )}

      {(currentStats.notifications.length > 0 ||
        currentStats.recentActivity.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-neutral-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-neutral-900">
                So‘nggi bildirishnomalar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentStats.notifications.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Bildirishnomalar mavjud emas.
                </p>
              ) : (
                currentStats.notifications.slice(0, 6).map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                  >
                    <p className="text-sm font-medium text-neutral-900">
                      {notification.message}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="border-neutral-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-neutral-900">
                So‘nggi faoliyat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentStats.recentActivity.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Faollik jurnali bo‘sh.
                </p>
              ) : (
                currentStats.recentActivity.slice(0, 6).map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                  >
                    <p className="text-sm font-medium text-neutral-900">
                      {activity.message}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatDateTime(activity.createdAt)}
                      {activity.user
                        ? ` • ${activity.user.name}${
                            activity.user.role ? ` (${activity.user.role})` : ""
                          }`
                        : ""}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
