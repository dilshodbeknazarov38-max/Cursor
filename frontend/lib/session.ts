export const ACCESS_COOKIE = "cpaAccessToken";
export const REFRESH_COOKIE = "cpaRefreshToken";
export const ROLE_COOKIE = "cpaRole";
export const USER_COOKIE = "cpaUser";

type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  role: string;
  userId: string;
  rememberMe?: boolean;
};

const buildCookie = (
  name: string,
  value: string,
  rememberMe?: boolean,
) => {
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : undefined; // 30 kun
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
  ];
  if (maxAge) {
    parts.push(`Max-Age=${maxAge}`);
  }
  return parts.join("; ");
};

export function setSession(payload: SessionPayload) {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = buildCookie(
    ACCESS_COOKIE,
    payload.accessToken,
    payload.rememberMe,
  );
  document.cookie = buildCookie(
    REFRESH_COOKIE,
    payload.refreshToken,
    payload.rememberMe,
  );
  document.cookie = buildCookie(ROLE_COOKIE, payload.role, payload.rememberMe);
  document.cookie = buildCookie(USER_COOKIE, payload.userId, payload.rememberMe);

  try {
    window.localStorage.setItem("cpa.accessToken", payload.accessToken);
    window.localStorage.setItem("cpa.refreshToken", payload.refreshToken);
    window.localStorage.setItem("cpa.role", payload.role);
    window.localStorage.setItem("cpa.userId", payload.userId);
  } catch {
    // LocalStorage mavjud bo‘lmasa, e’tibor bermaymiz.
  }
}

export function clearSession() {
  if (typeof document === "undefined") {
    return;
  }
  const expired = "Max-Age=0; Path=/; SameSite=Lax";
  document.cookie = `${ACCESS_COOKIE}=; ${expired}`;
  document.cookie = `${REFRESH_COOKIE}=; ${expired}`;
  document.cookie = `${ROLE_COOKIE}=; ${expired}`;
  document.cookie = `${USER_COOKIE}=; ${expired}`;

  try {
    window.localStorage.removeItem("cpa.accessToken");
    window.localStorage.removeItem("cpa.refreshToken");
    window.localStorage.removeItem("cpa.role");
    window.localStorage.removeItem("cpa.userId");
  } catch {
    // LocalStorage mavjud bo‘lmasa.
  }
}

export function getClientAccessToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${ACCESS_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
}
