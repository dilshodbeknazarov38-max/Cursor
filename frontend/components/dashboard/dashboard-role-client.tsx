"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { TrendChart } from "@/components/dashboard/charts";
import type { DashboardRoleConfig } from "@/lib/dashboard-config";
import { API_BASE_URL } from "@/lib/api";
import {
  REFRESH_COOKIE,
  clearSession,
  getClientAccessToken,
} from "@/lib/session";

export type DashboardStats = {
  role: string;
  metrics: {
    label: string;
    value: string;
    change?: string;
  }[];
  charts: {
    leads: { label: string; value: number }[];
    sales: { label: string; value: number }[];
    active: { label: string; value: number }[];
  };
  summary: {
    users: number;
    leads: number;
    sales: number;
  };
  fromFallback?: boolean;
};

type NotificationItem = {
  id: string;
  message: string;
  createdAt: string;
  type: string;
  seen: boolean;
};

type ActivityItem = {
  id: string;
  action: string;
  createdAt: string;
  ip?: string | null;
  device?: string | null;
};

type UserRow = {
  id: string;
  firstName: string;
  nickname: string;
  phone: string;
  status: string;
  role?: {
    name: string;
    slug: string;
  } | null;
};

type ProductRow = {
  id: string;
  name: string;
  status: string;
  price: string;
};

type OrderRow = {
  id: string;
  status: string;
  amount: string;
  createdAt: string;
};

type PayoutRow = {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
};

type DashboardRoleClientProps = {
  config: DashboardRoleConfig;
  stats: DashboardStats;
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Faol",
  BLOCKED: "Bloklangan",
  INACTIVE: "Faol emas",
  DRAFT: "Qoralama",
  NEW: "Yangi",
  ASSIGNED: "Biriktirilgan",
  IN_DELIVERY: "Yetkazilmoqda",
  DELIVERED: "Yakunlangan",
  RETURNED: "Qaytarilgan",
  ARCHIVED: "Arxivlangan",
  PENDING: "Ko‘rib chiqilmoqda",
  APPROVED: "Tasdiqlangan",
  REJECTED: "Rad etilgan",
  PAID: "To‘langan",
  CANCELLED: "Bekor qilingan",
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("uz-UZ");

export function DashboardRoleClient({
  config,
  stats,
}: DashboardRoleClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [currentStats, setCurrentStats] = useState<DashboardStats>(stats);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserRow[]>([]);
  const [adminProducts, setAdminProducts] = useState<ProductRow[]>([]);
  const [adminOrders, setAdminOrders] = useState<OrderRow[]>([]);
  const [payoutRows, setPayoutRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutComment, setPayoutComment] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  useEffect(() => {
    setCurrentStats(stats);
  }, [stats]);

  useEffect(() => {
    if (stats.fromFallback) {
      toast({
        title: "Ma’lumotlar afsuski to‘liq emas",
        description:
          "API ma’lumotlari vaqtincha mavjud emas. Namunaviy ko‘rsatkichlar aks ettirildi.",
        variant: "destructive",
      });
    }
  }, [stats.fromFallback, toast]);

  useEffect(() => {
    const token = getClientAccessToken();
    if (!token) {
      return;
    }

    let ignore = false;

    const loadData = async () => {
      setLoading(true);
      setFetchError(null);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

        const payoutUrl =
          config.slug === "admin"
            ? `${API_BASE_URL}/payouts?status=PENDING`
            : config.slug === "targetolog"
            ? `${API_BASE_URL}/payouts`
            : null;

        try {
          const [
          statsRes,
          notificationsRes,
          activityRes,
          usersRes,
          productsRes,
          ordersRes,
          payoutsRes,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/stats/dashboard/${config.slug}`, {
            headers,
          }),
          fetch(`${API_BASE_URL}/notifications?limit=6`, { headers }),
          fetch(`${API_BASE_URL}/activity/me?limit=6`, { headers }),
          config.slug === "admin"
            ? fetch(`${API_BASE_URL}/users`, { headers })
            : null,
          config.slug === "admin"
            ? fetch(`${API_BASE_URL}/products?status=ACTIVE`, { headers })
            : null,
          config.slug === "admin"
            ? fetch(`${API_BASE_URL}/orders?status=NEW`, { headers })
            : null,
            payoutUrl ? fetch(payoutUrl, { headers }) : null,
        ]);

        if (!ignore) {
          if (statsRes.ok) {
            const nextStats = (await statsRes.json()) as DashboardStats;
            setCurrentStats({ ...nextStats, fromFallback: false });
          }

          if (notificationsRes.ok) {
            const notifData = await notificationsRes.json();
            setNotifications(notifData.items ?? []);
          }

          if (activityRes.ok) {
            const activityData = await activityRes.json();
            setActivities(activityData.items ?? []);
          }

          if (config.slug === "admin") {
            if (usersRes && usersRes.ok) {
              const usersData = await usersRes.json();
              setAdminUsers(usersData ?? []);
            }
            if (productsRes && productsRes.ok) {
              const productsData = await productsRes.json();
              setAdminProducts(
                (productsData ?? []).map((product: any) => ({
                  id: product.id,
                  name: product.name,
                  status: product.status,
                  price: String(product.price),
                })),
              );
            }
            if (ordersRes && ordersRes.ok) {
              const ordersData = await ordersRes.json();
              setAdminOrders(
                (ordersData ?? []).map((order: any) => ({
                  id: order.id,
                  status: order.status,
                  amount: String(order.amount),
                  createdAt: order.createdAt,
                })),
              );
            }
            if (payoutsRes && payoutsRes.ok) {
              const payoutsData = await payoutsRes.json();
              setPayoutRows(
                (payoutsData ?? []).map((payout: any) => ({
                  id: payout.id,
                  status: payout.status,
                  amount: String(payout.amount),
                  createdAt: payout.createdAt,
                })),
              );
            }
          }
        }
      } catch (error) {
        console.error("Dashboard data load error", error);
        if (!ignore) {
          setFetchError(
            "Ma’lumotlarni yuklashda muammo yuz berdi. Iltimos, qayta urinib ko‘ring.",
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      ignore = true;
    };
  }, [config.slug]);

  const primaryMetrics = useMemo(
    () => currentStats.metrics ?? [],
    [currentStats.metrics],
  );

  const handleUserStatusChange = async (userId: string, status: string) => {
    const token = getClientAccessToken();
    if (!token) {
      toast({
        title: "Sessiya topilmadi",
        description: "Iltimos, qayta kirish qiling.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          typeof errorBody?.message === "string"
            ? errorBody.message
            : "Statusni yangilashda xatolik yuz berdi.";
        throw new Error(message);
      }

      setAdminUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status } : user,
        ),
      );

      toast({
        title: "Status yangilandi",
        description: "Foydalanuvchi holati muvaffaqiyatli o‘zgartirildi.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Xatolik",
        description:
          error instanceof Error
            ? error.message
            : "Amalni bajarib bo‘lmadi.",
        variant: "destructive",
      });
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
      const refreshToken = (() => {
        if (typeof document === "undefined") return null;
        const entry = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${REFRESH_COOKIE}=`));
        return entry ? decodeURIComponent(entry.split("=")[1]) : null;
      })();

      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          refreshToken: refreshToken ?? undefined,
        }),
      });
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      clearSession();
      setLoggingOut(false);
      router.push("/kirish");
      toast({
        title: "Sessiya yakunlandi",
        description: "Hisobingizdan muvaffaqiyatli chiqdingiz.",
      });
    }
  };

  const handlePayoutRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = getClientAccessToken();
    if (!token) {
      toast({
        title: "Sessiya topilmadi",
        description: "Iltimos, qayta kirish qiling.",
        variant: "destructive",
      });
      return;
    }

    const amountValue = Number(payoutAmount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Noto‘g‘ri summa",
        description: "Yaroqli va musbat summa kiriting.",
        variant: "destructive",
      });
      return;
    }

    setPayoutSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amountValue,
          comment: payoutComment || undefined,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          typeof errorBody?.message === "string"
            ? errorBody.message
            : "To‘lov so‘rovi yuborilmadi.";
        throw new Error(message);
      }

      const data = await response.json().catch(() => null);

      setPayoutAmount("");
      setPayoutComment("");
      if (data?.payout) {
        setPayoutRows((prev) => [
          {
            id: data.payout.id,
            status: data.payout.status,
            amount: String(data.payout.amount),
            createdAt: data.payout.createdAt,
          },
          ...prev,
        ]);
      }
      toast({
        title: "To‘lov so‘rovi yuborildi",
        description: "Admin tasdiqlashi bilan sizga xabar beramiz.",
      });
    } catch (error) {
      console.error("Payout request error", error);
      toast({
        title: "Xatolik",
        description:
          error instanceof Error
            ? error.message
            : "So‘rovni yuborishda muammo yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setPayoutSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">
            {config.title}
          </h1>
          <p className="text-sm text-neutral-600">{config.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs font-medium"
          >
            <Link href="/panel">Bosh sahifa</Link>
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

      {fetchError ? (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">
            {fetchError}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryMetrics.map((metric) => (
          <Card key={`${config.slug}-${metric.label}`} className="shadow-sm">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {metric.label}
              </p>
              <p className="text-2xl font-semibold text-neutral-900">
                {metric.value}
              </p>
              {metric.change ? (
                <p className="text-xs font-medium text-emerald-600">
                  {metric.change}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <TrendChart
          title="Leadlar dinamikasi"
          description="Oylik leadlar soni"
          data={currentStats.charts.leads}
          gradientId="leads"
        />
        <TrendChart
          title="Sotuv trends"
          description="Sotuvlar statistikasi"
          data={currentStats.charts.sales}
          gradientId="sales"
        />
        <TrendChart
          title="Faollik"
          description="Faol foydalanuvchilar"
          data={currentStats.charts.active}
          gradientId="active"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="border-neutral-200 bg-neutral-50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-neutral-700">
              Umumiy foydalanuvchilar
            </h3>
            <p className="mt-3 text-3xl font-bold text-neutral-900">
              {currentStats.summary.users.toLocaleString("uz-UZ")}
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Tizimga kirish imkoniga ega barcha rollar.
            </p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 bg-neutral-50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-neutral-700">
              Yaratilgan leadlar
            </h3>
            <p className="mt-3 text-3xl font-bold text-neutral-900">
              {currentStats.summary.leads.toLocaleString("uz-UZ")}
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Targetologlar tomonidan yetkazilgan sifatli leadlar.
            </p>
          </CardContent>
        </Card>
        <Card className="border-neutral-200 bg-neutral-50">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-neutral-700">
              Yakunlangan sotuvlar
            </h3>
            <p className="mt-3 text-3xl font-bold text-neutral-900">
              {currentStats.summary.sales.toLocaleString("uz-UZ")}
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              Operatorlar tomonidan muvaffaqiyatli yopilgan buyurtmalar.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {config.sections.map((section) => (
          <Card
            key={`${config.slug}-${section.title}`}
            className="border-neutral-200 bg-white shadow-sm"
          >
            <CardContent className="space-y-4 p-6">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  {section.title}
                </h3>
                {section.description ? (
                  <p className="mt-1 text-sm text-neutral-500">
                    {section.description}
                  </p>
                ) : null}
              </div>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div
                    key={`${section.title}-${item.title}`}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-neutral-900">
                      {item.title}
                    </p>
                    {item.subtitle ? (
                      <p className="text-xs text-neutral-600">{item.subtitle}</p>
                    ) : null}
                    {item.status ? (
                      <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                        {item.status}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {(notifications.length > 0 || activities.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-neutral-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-neutral-900">
                So‘nggi bildirishnomalar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Hozircha bildirishnomalar yo‘q.
                </p>
              ) : (
                notifications.map((notification) => (
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
                Faollik jurnali
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Yaqinda faoliyat qayd etilmagan.
                </p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                  >
                    <p className="text-sm font-medium text-neutral-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatDateTime(activity.createdAt)}
                      {activity.ip ? ` • IP: ${activity.ip}` : null}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {config.slug === "admin" && (
        <section className="space-y-6">
          <Card className="border-neutral-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-neutral-900">
                Foydalanuvchilar boshqaruvi
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs font-medium"
              >
                <Link href="/dashboard/admin">
                  To‘liq ro‘yxat
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {adminUsers.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Foydalanuvchilar ro‘yxati topilmadi.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-neutral-200">
                  <table className="min-w-full divide-y divide-neutral-200 text-sm">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-neutral-600">
                          Foydalanuvchi
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-neutral-600">
                          Telefon
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-neutral-600">
                          Status
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-neutral-600">
                          Amal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {adminUsers.slice(0, 6).map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-2">
                            <p className="font-medium text-neutral-900">
                              {user.firstName} ({user.nickname})
                            </p>
                            <p className="text-xs text-neutral-500">
                              {user.role?.name ?? "Rol belgilanmagan"}
                            </p>
                          </td>
                          <td className="px-4 py-2 text-neutral-600">
                            {user.phone}
                          </td>
                          <td className="px-4 py-2 text-neutral-600">
                            {STATUS_LABELS[user.status] ?? user.status}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {user.status !== "ACTIVE" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    void handleUserStatusChange(user.id, "ACTIVE")
                                  }
                                >
                                  Faollashtirish
                                </Button>
                              ) : (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    void handleUserStatusChange(user.id, "BLOCKED")
                                  }
                                >
                                  Bloklash
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-neutral-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-neutral-900">
                  Faol mahsulotlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {adminProducts.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    Faol mahsulotlar topilmadi.
                  </p>
                ) : (
                  adminProducts.slice(0, 6).map((product) => (
                    <div
                      key={product.id}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-neutral-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Narx: {product.price} •{" "}
                        {STATUS_LABELS[product.status] ?? product.status}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="border-neutral-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-neutral-900">
                  Yangi buyurtmalar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {adminOrders.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    Yangi buyurtmalar topilmadi.
                  </p>
                ) : (
                  adminOrders.slice(0, 6).map((order) => (
                    <div
                      key={order.id}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-neutral-900">
                        Buyurtma #{order.id.slice(0, 6).toUpperCase()}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {STATUS_LABELS[order.status] ?? order.status} •{" "}
                        {order.amount} • {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-neutral-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-neutral-900">
                Kutilayotgan to‘lovlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payoutRows.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Kutilayotgan to‘lovlar mavjud emas.
                </p>
              ) : (
                payoutRows.slice(0, 6).map((payout) => (
                  <div
                    key={payout.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-neutral-900">
                      {payout.amount}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {STATUS_LABELS[payout.status] ?? payout.status} •{" "}
                      {formatDateTime(payout.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {config.slug === "targetolog" && (
        <section className="space-y-6">
          <Card className="border-neutral-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-neutral-900">
                To‘lov so‘rovi yuborish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(event) => void handlePayoutRequest(event)}
                className="grid gap-4 sm:grid-cols-2"
              >
                <div className="sm:col-span-1">
                  <label
                    htmlFor="payout-amount"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Summa (so‘m)
                  </label>
                  <input
                    id="payout-amount"
                    type="number"
                    min={10000}
                    step={1000}
                    value={payoutAmount}
                    onChange={(event) => setPayoutAmount(event.target.value)}
                    placeholder="500000"
                    className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                    required
                  />
                </div>
                <div className="sm:col-span-1">
                  <label
                    htmlFor="payout-comment"
                    className="text-sm font-medium text-neutral-700"
                  >
                    Izoh (ixtiyoriy)
                  </label>
                  <input
                    id="payout-comment"
                    type="text"
                    value={payoutComment}
                    onChange={(event) => setPayoutComment(event.target.value)}
                    placeholder="Oxirgi kampaniya uchun bonus..."
                    className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="default"
                    disabled={payoutSubmitting}
                  >
                    {payoutSubmitting ? "Yuborilmoqda..." : "So‘rov yuborish"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card className="border-neutral-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-neutral-900">
                Mening so‘nggi to‘lov so‘roqlarim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payoutRows.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Hozircha to‘lov so‘rovlari mavjud emas.
                </p>
              ) : (
                payoutRows.slice(0, 5).map((payout) => (
                  <div
                    key={payout.id}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-neutral-900">
                      {payout.amount} so‘m
                    </p>
                    <p className="text-xs text-neutral-500">
                      {STATUS_LABELS[payout.status] ?? payout.status} •{" "}
                      {formatDateTime(payout.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {loading ? (
        <p className="text-xs text-neutral-400">
          Ma’lumotlar yangilanmoqda...
        </p>
      ) : null}
    </div>
  );
}
