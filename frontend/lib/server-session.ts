import { cookies } from "next/headers";

import { ACCESS_COOKIE, ROLE_COOKIE, USER_COOKIE } from "./session";

export function getServerSession() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value ?? null;
  const role = cookieStore.get(ROLE_COOKIE)?.value ?? null;
  const userId = cookieStore.get(USER_COOKIE)?.value ?? null;

  return {
    accessToken,
    role,
    userId,
  };
}
