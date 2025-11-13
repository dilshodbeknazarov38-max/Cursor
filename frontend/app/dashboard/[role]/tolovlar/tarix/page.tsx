import { redirect } from "next/navigation";

import { SUPPORTED_DASHBOARD_ROLES } from "@/lib/dashboard-config";

type PaymentsHistoryRedirectProps = {
  params: Promise<{ role: string }>;
};

export default async function PaymentsHistoryRedirectPage({
  params,
}: PaymentsHistoryRedirectProps) {
  const { role } = await params;
  redirect(`/dashboard/${role}/payout`);
}

export function generateStaticParams() {
  return SUPPORTED_DASHBOARD_ROLES.map((role) => ({ role }));
}
