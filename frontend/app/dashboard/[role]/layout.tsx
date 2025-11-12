import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getDashboardConfig } from "@/lib/dashboard-config";

export default async function DashboardRoleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const config = getDashboardConfig(role);

  if (!config) {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-neutral-100 text-neutral-900">
      <DashboardSidebar roleLabel={config.label} nav={config.nav} />
      <div className="flex flex-1 flex-col">
        <header className="border-b border-neutral-200 bg-white px-6 py-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                CPAMaRKeT.Uz
              </p>
              <h1 className="text-2xl font-semibold text-neutral-900">
                {config.title}
              </h1>
              <p className="text-sm text-neutral-500">{config.description}</p>
            </div>
            <span className="mt-2 inline-flex h-9 items-center rounded-full border border-neutral-200 px-4 text-xs font-semibold uppercase tracking-wide text-neutral-600 lg:mt-0">
              {config.label}
            </span>
          </div>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
