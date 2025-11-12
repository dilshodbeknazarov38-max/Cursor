import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_COOKIE, ROLE_COOKIE } from "@/lib/session";

const DASHBOARD_PREFIX = "/dashboard";
const PANEL_ROUTE = "/panel";
const LOGIN_ROUTE = "/kirish";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const role = req.cookies.get(ROLE_COOKIE)?.value?.toLowerCase();

  const isProtectedRoute =
    pathname.startsWith(DASHBOARD_PREFIX) || pathname === PANEL_ROUTE;

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!accessToken || !role) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = LOGIN_ROUTE;
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === PANEL_ROUTE) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = `${DASHBOARD_PREFIX}/${role}`;
    return NextResponse.redirect(dashboardUrl);
  }

  const parts = pathname.split("/");
  const requestedRole = parts[2]?.toLowerCase();

  if (requestedRole && requestedRole !== role) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `${DASHBOARD_PREFIX}/${role}`;
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel", "/dashboard/:path*"],
};
