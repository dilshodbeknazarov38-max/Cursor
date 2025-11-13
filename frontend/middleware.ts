import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_COOKIE, ROLE_COOKIE } from "@/lib/session";
import { getDashboardPathFromRole, normalizeRoleSlug } from "@/lib/roles";

const DASHBOARD_PREFIX = "/dashboard";
const PANEL_ROUTE = "/panel";
const LOGIN_ROUTE = "/kirish";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const rawRoleSlug = req.cookies.get(ROLE_COOKIE)?.value ?? undefined;
  const normalizedRoleSlug = normalizeRoleSlug(rawRoleSlug);
  const dashboardSegment = getDashboardPathFromRole(normalizedRoleSlug);

  const isProtectedRoute =
    pathname.startsWith(DASHBOARD_PREFIX) || pathname === PANEL_ROUTE;

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!accessToken || !rawRoleSlug) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = LOGIN_ROUTE;
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === PANEL_ROUTE) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = `${DASHBOARD_PREFIX}/${dashboardSegment}`;
    return NextResponse.redirect(dashboardUrl);
  }

  const parts = pathname.split("/");
  const requestedRole = parts[2]?.toLowerCase();

  if (requestedRole && requestedRole !== dashboardSegment) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `${DASHBOARD_PREFIX}/${dashboardSegment}`;
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel", "/dashboard/:path*"],
};
