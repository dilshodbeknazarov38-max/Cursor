import { redirect } from "next/navigation";

import { SUPPORTED_DASHBOARD_ROLES } from "@/lib/dashboard-config";

type CommissionRedirectProps = {
  params: Promise<{ role: string }>;
};

export default async function CommissionRedirectPage({
  params,
}: CommissionRedirectProps) {
  const { role } = await params;
  redirect(`/dashboard/${role}/payout`);
}

export function generateStaticParams() {
  return SUPPORTED_DASHBOARD_ROLES.map((role) => ({ role }));
}
