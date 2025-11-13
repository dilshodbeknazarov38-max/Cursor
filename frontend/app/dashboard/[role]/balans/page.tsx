import { redirect } from "next/navigation";

import { SUPPORTED_DASHBOARD_ROLES } from "@/lib/dashboard-config";

type BalanceRedirectPageProps = {
  params: Promise<{ role: string }>;
};

export default async function BalanceRedirectPage({
  params,
}: BalanceRedirectPageProps) {
  const { role } = await params;
  redirect(`/dashboard/${role}/payout`);
}

export function generateStaticParams() {
  return SUPPORTED_DASHBOARD_ROLES.map((role) => ({ role }));
}
