import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { DASHBOARD_CONFIG } from "@/lib/dashboard-config";

export default function DashboardLandingPage() {
  const roles = Object.values(DASHBOARD_CONFIG);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 px-6 py-12 text-neutral-900">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            CPAMaRKeT.Uz
          </p>
          <h1 className="text-3xl font-semibold text-neutral-900">
            Rolga mos boshqaruv panelingizni tanlang
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Har bir rol uchun alohida tajriba va nazorat vositalari tayyorlandi.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <Link key={role.slug} href={`/dashboard/${role.slug}`}>
              <Card className="h-full border-neutral-200 shadow-sm transition hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg">
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      {role.label}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-neutral-900">
                      {role.title}
                    </h2>
                    <p className="mt-2 text-sm text-neutral-500">
                      {role.description}
                    </p>
                  </div>
                  <span className="mt-6 inline-flex text-sm font-medium text-neutral-700">
                    Ko‘rish →
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
