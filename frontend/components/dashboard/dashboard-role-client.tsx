"use client";

import { useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { TrendChart } from "@/components/dashboard/charts";

import type { DashboardRoleConfig } from "@/lib/dashboard-config";

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

type DashboardRoleClientProps = {
  config: DashboardRoleConfig;
  stats: DashboardStats;
};

export function DashboardRoleClient({
  config,
  stats,
}: DashboardRoleClientProps) {
  const { toast } = useToast();

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

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.metrics.map((metric) => (
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
          data={stats.charts.leads}
          gradientId="leads"
        />
        <TrendChart
          title="Sotuv trends"
          description="Sotuvlar statistikasi"
          data={stats.charts.sales}
          gradientId="sales"
        />
        <TrendChart
          title="Faollik"
          description="Faol foydalanuvchilar"
          data={stats.charts.active}
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
              {stats.summary.users.toLocaleString("uz-UZ")}
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
              {stats.summary.leads.toLocaleString("uz-UZ")}
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
              {stats.summary.sales.toLocaleString("uz-UZ")}
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
    </div>
  );
}
