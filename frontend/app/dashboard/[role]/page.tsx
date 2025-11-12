import { notFound } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import {
  DashboardMetric,
  getDashboardConfig,
  DashboardSectionItem,
  SUPPORTED_DASHBOARD_ROLES,
} from "@/lib/dashboard-config";

type DashboardRolePageProps = {
  params: Promise<{ role: string }>;
};

const metricToneStyles: Record<
  NonNullable<DashboardMetric["tone"]>,
  string
> = {
  positive: "text-emerald-600",
  negative: "text-rose-600",
  neutral: "text-neutral-500",
};

const statusToneStyles: Record<
  NonNullable<DashboardSectionItem["statusTone"]>,
  string
> = {
  info: "border-sky-200 bg-sky-100 text-sky-700",
  success: "border-emerald-200 bg-emerald-100 text-emerald-700",
  warning: "border-amber-200 bg-amber-100 text-amber-700",
};

export default async function DashboardRolePage({
  params,
}: DashboardRolePageProps) {
  const { role } = await params;
  const config = getDashboardConfig(role);

  if (!config) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {config.metrics.map((metric) => (
          <Card
            key={`${config.slug}-${metric.label}`}
            className="border-neutral-200 shadow-sm"
          >
            <CardContent className="p-5">
              <p className="text-sm text-neutral-500">{metric.label}</p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-semibold text-neutral-900">
                  {metric.value}
                </p>
                {metric.change ? (
                  <span
                    className={`text-sm font-medium ${metric.tone ? metricToneStyles[metric.tone] : "text-neutral-500"}`}
                  >
                    {metric.change}
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {config.sections.map((section) => (
        <Card
          key={`${config.slug}-${section.title}`}
          className="border-neutral-200 bg-white/90 shadow-sm backdrop-blur"
        >
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                {section.title}
              </h2>
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
                  className="rounded-xl border border-neutral-200 bg-neutral-50/70 px-4 py-3 transition hover:border-neutral-300 hover:bg-white"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {item.title}
                      </p>
                      {item.subtitle ? (
                        <p className="text-sm text-neutral-500">
                          {item.subtitle}
                        </p>
                      ) : null}
                    </div>
                    {item.status ? (
                      <span
                        className={`inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium ${item.statusTone ? statusToneStyles[item.statusTone] : "border-neutral-200 bg-neutral-100 text-neutral-600"}`}
                      >
                        {item.status}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function generateStaticParams() {
  return SUPPORTED_DASHBOARD_ROLES.map((role) => ({ role }));
}
